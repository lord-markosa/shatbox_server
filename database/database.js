import sql from "mssql";
import { config } from "./config.js";

let poolConnection = null;
let connected = false;
let attempt = 0;
const maxAttempts = 3;

async function connect() {
    if (connected) {
        return;
    }
    try {
        poolConnection = await sql.connect(config);
        connected = true;
        console.log("Connected to database");
    } catch (error) {
        console.error(`Error connecting to database: ${JSON.stringify(error)}`);
    }
}

export async function establishConnection() {
    while (!connected && attempt < maxAttempts) {
        await connect();
        attempt++;
    }
}

export async function disconnect() {
    try {
        if (poolConnection) {
            await poolConnection.close();
            connected = false;
            console.log("Database connection closed");
        }
    } catch (error) {
        console.error(`Error closing database connection: ${error}`);
    }
}

export async function executeQuery(query, inputs) {
    await connect();
    if (!poolConnection) {
        throw new Error("No connection to database");
    }
    const request = poolConnection.request();

    inputs?.forEach((input) => {
        request.input(input.name, input.type, input.value);
    });

    try {
        const result = await request.query(query);
        return result.recordset || result.rowsAffected[0];
    } catch (error) {
        console.error(`Error executing query: ${error}`);
        throw error;
    }
}

// User functions

export async function createUser(user) {
    const query = `INSERT INTO Users (id, username, password) VALUES (@id, @username, @password)`;
    const inputs = [
        { name: "id", type: sql.NVarChar(72), value: user.id },
        { name: "username", type: sql.NVarChar(255), value: user.username },
        { name: "password", type: sql.NVarChar(255), value: user.password },
    ];
    return executeQuery(query, inputs);
}

export async function getUserByUsername(username) {
    const query = `SELECT * FROM Users WHERE username = @username`;
    const inputs = [
        { name: "username", type: sql.NVarChar(255), value: username },
    ];
    return executeQuery(query, inputs).then((results) => results[0] || null);
}

export async function getUserById(userId) {
    const query = `SELECT * FROM Users WHERE id = @userId`;
    const inputs = [{ name: "userId", type: sql.NVarChar(72), value: userId }];
    return executeQuery(query, inputs).then((results) => results[0] || null);
}

// Story functions

export async function getAllStory() {
    const query = `SELECT * FROM Story`;
    return executeQuery(query);
}

export async function createStory(story) {
    const query = `
    INSERT INTO Story (id, content, createdAt, creator, likedBy)
    VALUES (@id, @content, @createdAt, @creator, @likedBy)
    `;
    const inputs = [
        { name: "id", type: sql.NVarChar(72), value: story.id },
        { name: "content", type: sql.NVarChar(sql.MAX), value: story.content },
        { name: "createdAt", type: sql.DateTime, value: story.createdAt },
        { name: "creator", type: sql.NVarChar(255), value: story.creator },
        {
            name: "likedBy",
            type: sql.NVarChar(sql.MAX),
            value: JSON.stringify(story.likedBy),
        },
    ];
    return executeQuery(query, inputs);
}

export async function getStoryById(storyId) {
    const query = `SELECT * FROM Story WHERE id = @storyId`;
    const inputs = [
        { name: "storyId", type: sql.NVarChar(72), value: storyId },
    ];
    return executeQuery(query, inputs).then((results) => results[0] || null);
}

export async function updateStory(storyId, updatedData) {
    const query = `
        UPDATE Story SET content = @content, updatedAt = @updatedAt
        WHERE id = @storyId
    `;
    const inputs = [
        { name: "storyId", type: sql.NVarChar(72), value: storyId },
        {
            name: "content",
            type: sql.NVarChar(sql.MAX),
            value: updatedData.content,
        },
        { name: "updatedAt", type: sql.DateTime, value: updatedData.updatedAt },
    ];
    return executeQuery(query, inputs);
}

export async function deleteStory(storyId) {
    const query = `DELETE FROM Story WHERE id = @storyId`;
    const inputs = [
        { name: "storyId", type: sql.NVarChar(72), value: storyId },
    ];
    return executeQuery(query, inputs);
}

export async function likeStory(storyId, username) {
    // todo refactor this into user
    const story = await getStoryById(storyId);
    const likedBy = JSON.parse(story.likedBy) || [];
    likedBy.push(username);

    const query = `
        UPDATE Story SET likedBy = @likedBy WHERE id = @storyId
    `;
    const inputs = [
        { name: "storyId", type: sql.NVarChar(72), value: storyId },
        {
            name: "likedBy",
            type: sql.NVarChar(sql.MAX),
            value: JSON.stringify(likedBy),
        },
    ];
    return executeQuery(query, inputs);
}

// Chat functions
export async function findChat(user1Id, user2Id) {
    return await executeQuery(
        `SELECT * FROM Chats WHERE (user1Id = @user1Id AND user2Id = @user2Id) OR (user1Id = @user2Id AND user2Id = @user1Id)`,
        [
            {
                name: "user1Id",
                type: sql.NVarChar(72),
                value: user1Id,
            },
            {
                name: "user2Id",
                type: sql.NVarChar(72),
                value: user2Id,
            },
        ]
    );
}

export async function insertMessage(id, chatId, senderId, receiverId, content) {
    console.log(id, chatId, senderId, receiverId, content);
    return await executeQuery(
        `INSERT INTO Messages (id, chatId, senderId, receiverId, content) 
            VALUES (@id, @chatId, @senderId, @receiverId, @content)
        `,
        [
            {
                name: "id",
                type: sql.NVarChar(72),
                value: id,
            },
            {
                name: "chatId",
                type: sql.NVarChar(72),
                value: chatId,
            },
            {
                name: "senderId",
                type: sql.NVarChar(72),
                value: senderId,
            },
            {
                name: "receiverId",
                type: sql.NVarChar(72),
                value: receiverId,
            },
            {
                name: "content",
                type: sql.NVarChar(sql.MAX),
                value: content,
            },
        ]
    );
}

export async function getMessagesByChatId(chatId, userId) {
    return executeQuery(
        `SELECT 
            id, 
            content, 
            timestamp, 
            CASE 
                WHEN senderId = @userId THEN CAST(1 AS BIT) 
                ELSE CAST(0 AS BIT) 
                END AS sent
        FROM Messages WHERE chatId = @chatId ORDER BY timestamp
        `,
        [
            { name: "chatId", type: sql.NVarChar(72), value: chatId },
            { name: "userId", type: sql.NVarChar(72), value: userId },
        ]
    );
}

export async function getUserChats(userId) {
    const query = `
        SELECT id, username1, username2 FROM Chats
        WHERE user1Id = @userId OR user2Id = @userId
    `;
    const inputs = [{ name: "userId", type: sql.NVarChar(72), value: userId }];
    return executeQuery(query, inputs);
}

export async function getNewPotentialChatPartners(userId) {
    return await executeQuery(
        `SELECT u.id, u.username FROM Users u
            WHERE u.id != @userId
            AND u.id NOT IN (
                SELECT c.user2Id FROM Chats c WHERE c.user1Id = @userId
            UNION
                SELECT c.user1Id FROM Chats c WHERE c.user2Id = @userId
            )`,
        [
            {
                name: "userId",
                type: sql.NVarChar(72),
                value: userId,
            },
        ]
    );
}

export async function createChat(id, user1Id, username1, user2Id, username2) {
    return executeQuery(
        `INSERT INTO Chats (id, user1Id, username1, user2Id, username2) 
            VALUES (@id, @user1Id, @username1, @user2Id, @username2)`,
        [
            { name: "id", type: sql.NVarChar(72), value: id },
            { name: "user1Id", type: sql.NVarChar(72), value: user1Id },
            { name: "username1", type: sql.NVarChar(255), value: username1 },
            { name: "user2Id", type: sql.NVarChar(72), value: user2Id },
            { name: "username2", type: sql.NVarChar(255), value: username2 },
        ]
    );
}

export async function getChatById(chatId) {
    return executeQuery(`SELECT * FROM Chats WHERE id = @chatId`, [
        { name: "chatId", type: sql.NVarChar(72), value: chatId },
    ]).then((results) => results[0] || null);
}
