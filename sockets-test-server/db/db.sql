CREATE DATABASE projecttree;

CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(30)
);

CREATE TABLE "session" (
    session_id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "user_in_session" (
    user_in_session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    socket_id varchar(20),
    is_connected BOOLEAN DEFAULT TRUE,
    is_host BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    FOREIGN KEY (session_id) REFERENCES "session"(session_id)
);

CREATE TABLE "card_type" (
    card_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(15)
);

INSERT INTO card_type(type_name) VALUES
('club'), ('diamond'), ('heart') ,('spade'), ('joker');

CREATE TABLE "card" (
    card_id SERIAL PRIMARY KEY,
    card_type_id INTEGER NOT NULL,
    card_value INTEGER,

    FOREIGN KEY (card_type_id) REFERENCES "card_type"(card_type_id)
);

CREATE TABLE "group" (
    group_id SERIAL PRIMARY KEY,
    cards_count INTEGER DEFAULT 0
);

CREATE TABLE "card_in_group" (
    card_in_group_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,

    FOREIGN KEY (group_id) REFERENCES "group"(group_id),
    FOREIGN KEY (card_id) REFERENCES "card"(card_id)
);

CREATE TABLE "player" (
    player_id SERIAL PRIMARY KEY,
    hand_group_id INTEGER,
    look_up_group_id INTEGER,
    look_down_group_id INTEGER,
    turn INTEGER NOT NULL,
    turns_count INTEGER DEFAULT 0,
    is_playing BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (hand_group_id) REFERENCES "group"(group_id),
    FOREIGN KEY (look_up_group_id) REFERENCES "group"(group_id),
    FOREIGN KEY (look_down_group_id) REFERENCES "group"(group_id)
);

CREATE TABLE "effects" (
    effects_id SERIAL PRIMARY KEY,
    transparent BOOLEAN DEFAULT FALSE,
    minor BOOLEAN DEFAULT FALSE,
    skip_turns INTEGER DEFAULT 0
);

CREATE TABLE "game" (
    game_id SERIAL PRIMARY KEY,
    desk_group_id INTEGER,
    pile_group_id INTEGER,
    discarded_group_id INTEGER,
    top_card_id INTEGER,
    actual_turn INTEGER,
    effects_id INTEGER,
    turns_count INTEGER DEFAULT 0,
    is_finished BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (desk_group_id) REFERENCES "group"(group_id),
    FOREIGN KEY (pile_group_id) REFERENCES "group"(group_id),
    FOREIGN KEY (discarded_group_id) REFERENCES "group"(group_id)
);

CREATE TABLE "game_in_session" (
    game_in_session_id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    begin_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finish_at TIMESTAMPTZ
);

CREATE TABLE "player_in_game" (
    player_in_game_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    FOREIGN KEY (player_id) REFERENCES "player"(player_id),
    FOREIGN KEY (game_id) REFERENCES "game"(game_id),
    FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);


CREATE TABLE "action" (
    action_id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    action_name VARCHAR(20) NOT NULL,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (game_id) REFERENCES "game"(game_id),
    FOREIGN KEY (card_id) REFERENCES "card"(card_id),
    FOREIGN KEY (player_id) REFERENCES "player"(player_id)
);
