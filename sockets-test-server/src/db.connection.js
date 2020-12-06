const { Pool } = require('pg');

pool = new Pool({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME,
    port: process.env.DBPORT
});

pool.connect()

// Create functions

const createNewSession = async (clientId, username) => {
    let user = await pool.query('INSERT INTO \"user\"(username) VALUES ($1) RETURNING *', [username]);
    let session = await pool.query('INSERT INTO \"session\" DEFAULT VALUES RETURNING *');
    let connectionValues = [user.rows[0].user_id, session.rows[0].session_id, clientId];
    let connection = await pool.query('INSERT INTO \"user_in_session\"(user_id, session_id, socket_id) VALUES ($1, $2, $3) RETURNING *', connectionValues);

    let sessionId = session.rows[0].session_id;
    return sessionId;
}

const createPlayer = async (userId, turn) => {
    let player = await pool.query('INSERT INTO \"player\"(user_id, turn) VALUES ($1, $2) RETURNING *', [userId, turn]);
    
    let playerId = player.rows[0].player_id;
    return playerId; 
}

const joinSession = async (clientId, username, sessionId) => {
    let user = await pool.query('INSERT INTO \"user\"(username) VALUES ($1) RETURNING *', [username]);
    let connectionValues = [user.rows[0].user_id, sessionId, clientId];
    let connection = await pool.query('INSERT INTO \"user_in_session\"(user_id, session_id, socket_id, is_host) VALUES ($1, $2, $3, FALSE) RETURNING *', connectionValues);
 
    let usersInSession = await getUsersInSession(sessionId);
    return usersInSession;
}

const createGame = async (sessionId, gameState) => {
    // console.log(gameState);
    let effects = await pool.query('INSERT INTO \"effects\"(transparent, minor, skip_turns) VALUES (FALSE, FALSE, 0) RETURNING effects_id');
    let effectsId = effects.rows[0].effects_id;
    let gameValues = [gameState.actualTurn, gameState.top.index, effectsId];
    let game = await pool.query('INSERT INTO \"game\"(actual_turn, top_card_id, effects_id) VALUES ($1, $2, $3) RETURNING *', gameValues);
    let gameId = game.rows[0].game_id;
    await pool.query('INSERT INTO game_in_session(game_id, session_id) VALUES ($1, $2)', [gameId, sessionId]);
    let deskId = await pool.query('INSERT INTO \"group\"(group_name) VALUES (\'desk\') RETURNING group_id');
    let pileId = await pool.query('INSERT INTO \"group\"(group_name) VALUES (\'pile\') RETURNING group_id');
    let discardedId = await pool.query('INSERT INTO \"group\"(group_name) VALUES (\'discarded\') RETURNING group_id');

    let gameGroupsValues = [deskId.rows[0].group_id, pileId.rows[0].group_id, discardedId.rows[0].group_id, gameId];
    await pool.query('UPDATE \"game\" SET desk_group_id = $1, pile_group_id = $2, discarded_group_id = $3 WHERE game_id = $4', gameGroupsValues);
    
    let desk = gameState.desk;
    for(const i in desk) {
        await pool.query('INSERT INTO card_in_group(group_id, card_id) VALUES ($1, $2)', [deskId.rows[0].group_id, desk[i].index])
    }

    let playersData = gameState.playersStates;
    for(const playerId in playersData) {
        let playerConnectionValues = [playerId, gameId, playersData[playerId].userId];
        await pool.query('INSERT INTO player_in_game(player_id, game_id, user_id) VALUES ($1, $2, $3)', playerConnectionValues);

        
        let handId = await pool.query('INSERT INTO \"group\"(group_name) VALUES (\'hand\') RETURNING group_id');
        let hand = playersData[playerId].hand;
        for(const i in hand) {
            await pool.query('INSERT INTO card_in_group(group_id, card_id) VALUES ($1, $2)', [handId.rows[0].group_id, hand[i].index])
        }
        
        let lookUpId = await pool.query('INSERT INTO \"group\"(group_name) VALUES (\'lookUp\') RETURNING group_id');
        let lookUp = playersData[playerId].lookUp;
        for(const i in lookUp) {
            await pool.query('INSERT INTO card_in_group(group_id, card_id) VALUES ($1, $2)', [lookUpId.rows[0].group_id, lookUp[i].index])
        }

        let lookDownId = await pool.query('INSERT INTO \"group\"(group_name) VALUES (\'lookDown\') RETURNING group_id');
        let lookDown = playersData[playerId].lookDown;
        for(const i in lookDown) {
            await pool.query('INSERT INTO card_in_group(group_id, card_id) VALUES ($1, $2)', [lookDownId.rows[0].group_id, lookDown[i].index])
        }

        let playerGroupsValues = [handId.rows[0].group_id, lookUpId.rows[0].group_id, lookDownId.rows[0].group_id, playerId];
        await pool.query('UPDATE \"player\" SET hand_group_id = $1, look_up_group_id = $2, look_down_group_id = $3 WHERE player_id = $4', playerGroupsValues);

    }

    return gameId;
}


// Getter functions

const getUsersInSession = async (sessionId) => {
    let res = await pool.query(`
        SELECT u.user_id, u.username, us.socket_id, us.is_host FROM "user" AS u 
        JOIN user_in_session AS us 
        ON u.user_id = us.user_id AND us.is_connected = TRUE
        JOIN "session" AS s
        ON us.session_id = s.session_id AND s.is_active = TRUE
        WHERE s.session_id = $1;`, [sessionId])

    return res.rows;
}

const getGameState = async (gameId) => {
    let game = await pool.query('SELECT actual_turn, turns_count, direction, desk_group_id, pile_group_id, discarded_group_id FROM \"game\" WHERE game_id = $1', [gameId]);
    let effects = await getEffects(gameId);

    let desk = await getCardsInGroup(game.rows[0].desk_group_id);
    let pile = await getCardsInGroup(game.rows[0].pile_group_id);
    let discarded = await getCardsInGroup(game.rows[0].discarded_group_id);

    let stackedPile = await stackedPileCount(gameId);

    let players = await pool.query(`
        SELECT p.player_id, p.user_id, uis.socket_id, p.turn, u.username, p.hand_group_id, p.look_up_group_id, p.look_down_group_id 
        FROM \"player\" AS p 
        JOIN player_in_game AS pig 
        ON p.player_id = pig.player_id 
        JOIN user_in_session AS uis
        ON p.user_id = uis.user_id AND uis.is_connected = TRUE
        JOIN \"user\" AS u
        ON u.user_id = p.user_id
        WHERE pig.game_id = $1`, [gameId]);
    
    // console.log(players.rows);
    let clientsPlayerIds = { /*clientId: playerId*/ };
    let playersStates = {};
    for(let i in players.rows) {
        let playerId = players.rows[i].player_id;
        playersStates[playerId] = {
            userId: players.rows[i].user_id,
            clientId: players.rows[i].socket_id,
            name: players.rows[i].username,
            turn: players.rows[i].turn
        };
        clientsPlayerIds[players.rows[i].socket_id] = playerId;

        let handId = players.rows[i].hand_group_id;
        let lookUpId = players.rows[i].look_up_group_id;
        let lookDownId = players.rows[i].look_down_group_id;
        
        let handCards = await getCardsInGroup(handId);
        let lookUpCards = await getCardsInGroup(lookUpId);
        let lookDownCards = await getCardsInGroup(lookDownId);

        playersStates[playerId].hand = formatCardsFields(handCards);
        playersStates[playerId].lookUp = formatCardsFields(lookUpCards);
        playersStates[playerId].lookDown = formatCardsFields(lookDownCards);
    }

    let gameState = {
        gameId: gameId,
        desk: formatCardsFields(desk),
        pile: formatCardsFields(pile),
        discarded: formatCardsFields(discarded),
        playersStates: playersStates,
        clientsPlayerIds: clientsPlayerIds,
        direction: game.rows[0].direction,
        actualTurn: game.rows[0].actual_turn,
        turnsCount: game.rows[0].turns_count,
        stackedPile: stackedPile,
        effects: {
            transparent: effects.transparent,
            minor: effects.minor,
            skipTurns: effects.skip_turns
        }
    };

    return gameState;
}

const getPile = async (gameId) => {
    let pile = await pool.query(`
        SELECT c.card_id, c.card_type_id, c.card_value FROM \"card\" AS c
        JOIN card_in_group AS cg
        ON c.card_id = cg.card_id
        JOIN \"game\" AS g
        ON cg.group_id = g.pile_group_id
        WHERE g.game_id = $1`, [gameId]);

    return pile.rows;
}

const getCardsInGroup = async (groupId) => {
    let cards = await pool.query(`
        SELECT c.card_id, c.card_type_id, c.card_value FROM \"card\" AS c
        JOIN card_in_group AS cg
        ON c.card_id = cg.card_id
        WHERE cg.group_id = $1`, [groupId]);

    return cards.rows;
} 

const getConnectionsFromGame = async (gameId) => {
    let users = await pool.query(`
        SELECT uis.socket_id, p.player_id FROM user_in_session AS uis
        JOIN player AS p ON uis.user_id = p.user_id
        JOIN player_in_game AS pg ON p.player_id = pg.player_id
        JOIN game AS g ON pg.game_id = g.game_id
        WHERE g.game_id = $1 AND g.is_finished = false AND uis.is_connected = TRUE`, [gameId])

    let connections = {};
    users.rows.forEach(user => {
        connections[user.player_id] = user.socket_id;
    });

    return connections;
}

const getTopCard = async (gameId) => {
    let topCard = await pool.query(`
        SELECT c.card_id, c.card_type_id, c.card_value FROM \"card\" AS c 
        JOIN \"game\" AS g 
        ON c.card_id = g.top_card_id
        WHERE g.game_id = $1`, [gameId]);
    
    return topCard.rows[0];
}

const getCard = async (cardId) => {
    let card = await pool.query('SELECT * FROM \"card\" WHERE card_id = $1', [cardId]);
    return card.rows[0];
}

const getEffects = async (gameId) => {
    let effects = await pool.query(
        `SELECT e.effects_id, e.transparent, e.minor, e.skip_turns FROM \"effects\" AS e
        JOIN \"game\" AS g ON e.effects_id = g.effects_id
        WHERE g.game_id = $1`, [gameId]);

    return effects.rows[0];
}

const getPlayerTurn = async (playerId) => {
    let player = await pool.query('SELECT turn FROM \"player\" WHERE player_id = $1', [playerId]);
    return player.rows[0].turn;
}

const getActualTurn = async (gameId) => {
    let game = await pool.query('SELECT actual_turn FROM \"game\" WHERE game_id = $1', [gameId]);
    return game.rows[0].actual_turn;
}

const getFullDesk = async () => {
    const cards = await pool.query(`SELECT * FROM "card"`);
    let desk = [...cards.rows];
    desk = desk.map(card => {
        return {
            index: card.card_id,
            type: card.card_type_id,
            value: card.card_value
        }
    })
    return desk;
}

const getDirection = async (gameId) => {
    let direction = await pool.query('SELECT direction FROM \"game\" WHERE game_id = $1', [gameId]);
    return direction.rows[0].direction;
}

const playersInGameCount = async (gameId) => {
    let players = await pool.query(`
        SELECT COUNT(*) FROM player_in_game AS pg
        JOIN \"player\" AS p ON pg.player_id = p.player_id
        WHERE p.is_playing = TRUE AND pg.game_id = $1`, [gameId]);
    return players.rows[0].count;
}


// Utility functions

const dropCardInPile = async (cardId, playerId, gameId, group) => {
    let groupFrom = await pool.query('SELECT ' + group + '_group_id FROM \"player\" WHERE player_id = $1', [playerId]);
    let groupId = groupFrom.rows[0][group + "_group_id"];
    let droppedCard = await getCard(cardId);
    await pool.query('DELETE FROM card_in_group WHERE card_id = $1 AND group_id = $2 RETURNING *', [cardId, groupId]);
    let pileId = await pool.query('SELECT pile_group_id FROM \"game\" WHERE game_id = $1', [gameId]);
    await pool.query('INSERT INTO card_in_group(group_id, card_id) VALUES ($1, $2)', [pileId.rows[0].pile_group_id, cardId]);

    return droppedCard;
}


const pickUpCard = async (gameId, playerId) => {
    let topCard = await getTopCard(gameId);
    let hand = await pool.query(`
        SELECT g.group_id FROM \"group\" AS g
        JOIN \"player\" AS p ON p.hand_group_id = g.group_id
        WHERE p.player_id = $1`, [playerId]);
    let handId = hand.rows[0].group_id;

    let pickedCard = await addCardToGroup(topCard.card_id, handId);
    
    let group = await pool.query('SELECT desk_group_id FROM \"game\" WHERE game_id = $1', [gameId]);
    let deskId = group.rows[0].desk_group_id;
    await pool.query('DELETE FROM card_in_group WHERE card_id = $1 AND group_id = $2 RETURNING *', [topCard.card_id, deskId]);
    let cards = await getCardsInGroup(deskId);
    let topIndex = Math.floor(Math.random() * cards.length);
    let newTopId = cards[topIndex].card_id;
    await pool.query('UPDATE \"game\" SET top_card_id = $1 WHERE game_id = $2', [newTopId, gameId]);

    return formatCardsFields([pickedCard])[0];
}

const resetGameEffects = async (gameId) => {
    let res = await pool.query('UPDATE \"effects\" SET transparent = FALSE, minor = FALSE WHERE effects_id = (SELECT effects_id FROM \"game\" WHERE game_id = $1) RETURNING *', [gameId]);
    return res.rows[0];
}

const addCardToGroup = async (cardId, groupId) => {
    await pool.query('INSERT INTO card_in_group(group_id, card_id) VALUES ($1, $2)', [groupId, cardId]);
    let card = await getCard(cardId);
    return card;
}

const formatCardsFields = (cards) => {
    return cards.map(card => {
        return {
            index: card.card_id,
            type: card.card_type_id,
            value: card.card_value
        }
    })
}

const stackedPileCount = async (gameId) => {
    let pile = await getPile(gameId);

    let repeatedCount = 0;
    let pileLookUp = pile.slice(-4);
    if(pileLookUp.length) {
        let actualValue = pileLookUp[pileLookUp.length - 1].card_value;
        let diferentCard = false;
        for(let i = pileLookUp.length - 1; i >= 0; i--) {
            if(pileLookUp[i].card_value == actualValue && !diferentCard) {
                repeatedCount++;
                actualValue = pileLookUp[i].card_value;
            }
            else {
                diferentCard = true;
            }
        }
    }

    return repeatedCount;
}

const changeTurn = async (gameId, playerId) => {
    let game = await pool.query(`
        SELECT g.actual_turn, g.direction, e.skip_turns, e.effects_id FROM \"game\" AS g
        JOIN \"effects\" AS e ON g.effects_id = e.effects_id
        WHERE g.game_id = $1`, [gameId]);

    let playersInGame = await pool.query(`
        SELECT COUNT(*) FROM player_in_game AS pg
        JOIN \"player\" AS p ON pg.player_id = p.player_id
        WHERE p.is_playing = TRUE AND pg.game_id = $1`, [gameId]);

    let actualTurn = game.rows[0].actual_turn;
    let turn = actualTurn;
    let playersCount = playersInGame.rows[0].count;
    let direction = game.rows[0].direction;
    let skipTurns = game.rows[0].skip_turns;
    if(direction > 0) {
        for(let i = 0; i <= skipTurns; i++) {
            turn = turn + 1 <= playersCount ? turn + 1 : 1;
        }
    }
    else {
        for(let i = 0; i <= skipTurns; i++) {
            turn = turn - 1 > 0 ? turn - 1 : playersCount;
        }
    }

    await pool.query('UPDATE \"player\" SET turns_count = turns_count + 1 WHERE player_id = $1', [playerId]); 
    await pool.query('UPDATE \"effects\" SET skip_turns = 0 WHERE effects_id = $1', [game.rows[0].effects_id]); 
    let newTurn = await pool.query('UPDATE \"game\" SET actual_turn = $1 WHERE game_id = $2 RETURNING actual_turn', [turn, gameId]); 
    let turns = await pool.query('UPDATE \"game\" SET turns_count = turns_count + 1 WHERE game_id = $1 RETURNING turns_count', [gameId]); 

    let turnData = {
        actualTurn: newTurn.rows[0].actual_turn,
        turnsCount: turns.rows[0].turns_count,
        skipTurns: 0
    };

    return turnData 
}

const playerPickUpPile = async (gameId, playerId) => {
    let game = await pool.query(`SELECT pile_group_id, actual_turn, direction FROM \"game\" WHERE game_id = $1`, [gameId]);

    let playersInGame = await playersInGameCount(gameId);

    let pile = await getPile(gameId);
    let pileId = game.rows[0].pile_group_id;
    let hand = await pool.query(`
        SELECT g.group_id FROM \"group\" AS g
        JOIN \"player\" AS p ON p.hand_group_id = g.group_id
        WHERE p.player_id = $1`, [playerId]);
    let handId = hand.rows[0].group_id;

    console.log(handId);
    let newCards = [...pile].filter(card => card.card_value != -1);
    for(let i in newCards) {
        await pool.query('DELETE FROM card_in_group WHERE card_id = $1 AND group_id = $2 RETURNING *', [newCards[i].card_id, pileId]);
        await addCardToGroup(newCards[i].card_id, handId);
    }

    let actualTurn = game.rows[0].actual_turn;
    let turn = actualTurn;
    let playersCount = playersInGame;
    let direction = game.rows[0].direction;

    if(direction > 0) {
        turn = turn - 1 > 0 ? turn - 1 : playersCount;
    }
    else {
        turn = turn + 1 <= playersCount ? turn + 1 : 1;
    }

    await pool.query('UPDATE \"game\" SET actual_turn = $1 WHERE game_id = $2 RETURNING actual_turn', [turn, gameId]); 
    
    return formatCardsFields(newCards);
}

const discardPile = async (gameId) => {
    let groupData = await pool.query(`SELECT pile_group_id, discarded_group_id FROM \"game\" WHERE game_id = $1`, [gameId]);
    let pileId = groupData.rows[0].pile_group_id;
    let discardedId = groupData.rows[0].discarded_group_id; 
    let pile = await getPile(gameId);

    for(let i in pile) {
        await pool.query('DELETE FROM card_in_group WHERE card_id = $1 AND group_id = $2 RETURNING *', [pile[i].card_id, pileId]);
        await addCardToGroup(pile[i].card_id, discardedId);
    }
}

const applyEffects = async (gameId, effects) => {
    let effectsCall = await pool.query('SELECT e.effects_id FROM \"effects\" AS e JOIN \"game\" AS g ON g.effects_id = e.effects_id WHERE g.game_id = $1', [gameId]);
    let effectsId = effectsCall.rows[0].effects_id;
    console.log("effects id", effectsId);
    if(effects.transparent) {
        console.log("transparent")
        await pool.query('UPDATE \"effects\" SET transparent = TRUE WHERE effects_id = $1', [effectsId]);
    }
    if(effects.minor) {
        console.log("minor")
        await pool.query('UPDATE \"effects\" SET \"minor\" = TRUE WHERE effects_id = $1', [effectsId]);
    }
    if(effects.skipTurns) {
        console.log("skip")
        await pool.query('UPDATE \"effects\" SET skip_turns = skip_turns + 1 WHERE effects_id = $1', [effectsId]);
    }
    if(effects.direction) {
        console.log("direction")
        await pool.query('UPDATE \"game\" SET direction = -1 * direction WHERE game_id = $1', [gameId]);
    }

    let res = await pool.query(`
        SELECT g.direction, e.transparent, e.minor, e.skip_turns 
        FROM \"game\" AS g
        JOIN \"effects\" AS e ON g.effects_id = e.effects_id
        WHERE g.game_id = $1`, [gameId]);

    let effectsResult = {
        direction: res.rows[0].direction,
        effects: {
            transparent: res.rows[0].transparent,
            minor: res.rows[0].minor,
            skipTurns: res.rows[0].skip_turns
        }
    }

    return effectsResult;
} 

const setActualTurn = async (gameId, turn) => {
    let actualTurn = await pool.query('UPDATE \"game\" SET actual_turn = $1 WHERE game_id = $2 RETURNING actual_turn', [turn, gameId]); 
    return actualTurn.rows[0].actual_turn;
}

module.exports = {
    getFullDesk,
    createNewSession,
    joinSession,
    getUsersInSession,
    createPlayer,
    createGame,
    getTopCard,
    getCard,
    dropCardInPile,
    getPile,
    getEffects,
    resetGameEffects,
    getConnectionsFromGame,
    stackedPileCount,
    getGameState,
    pickUpCard,
    getPlayerTurn,
    getActualTurn,
    changeTurn,
    playerPickUpPile,
    discardPile,
    applyEffects,
    setActualTurn,
    playersInGameCount,
    getDirection
}
