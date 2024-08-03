import { executeQuery } from "./database.js";

const createUsersTableQuery = `
    CREATE TABLE Users (
        id NVARCHAR(72) NOT NULL PRIMARY KEY,
        username NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL
    );`;

const createStoryTableQuery = `
    CREATE TABLE Story (
        id NVARCHAR(72) NOT NULL PRIMARY KEY,
        content NVARCHAR(MAX) NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME,
        creator NVARCHAR(255) NOT NULL,
        likedBy NVARCHAR(MAX) DEFAULT '[]'
    );`;

const createChatMessagesTableQuery = `
    CREATE TABLE Chats (
        id NVARCHAR(72) NOT NULL PRIMARY KEY,
        user1Id NVARCHAR(72) NOT NULL,
        username1 NVARCHAR(255) NOT NULL,
        user2Id NVARCHAR(72) NOT NULL,
        username2 NVARCHAR(255) NOT NULL,
        timestamp DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user1Id) REFERENCES Users(id),
        FOREIGN KEY (user2Id) REFERENCES Users(id)
    );

    CREATE TABLE Messages (
        id NVARCHAR(72) NOT NULL PRIMARY KEY,
        chatId NVARCHAR(72) NOT NULL,
        senderId NVARCHAR(72) NOT NULL,
        receiverId NVARCHAR(72) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        timestamp DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (chatId) REFERENCES Chats(id),
        FOREIGN KEY (senderId) REFERENCES Users(id),
        FOREIGN KEY (receiverId) REFERENCES Users(id)
    );`;

const createTableQueries = [
    createUsersTableQuery,
    createStoryTableQuery,
    createChatMessagesTableQuery,
];

const dropUsersTableQuery = `DROP TABLE Users;`;
const dropStoryTableQuery = `DROP TABLE Story;`;
const dropChatMessagesTableQuery = `DROP TABLE Messages; DROP TABLE Chats;`;

const dropTableQueries = [
    dropChatMessagesTableQuery,
    dropStoryTableQuery,
    dropUsersTableQuery,
];

export async function createTables() {
    createTableQueries.forEach(async (query) => {
        try {
            await executeQuery(query);
        } catch (error) {
            console.error(`Error creating table: ${error}`);
        }
    });
}

export async function dropTables() {
    dropTableQueries.forEach(async (query) => {
        try {
            await executeQuery(query);
        } catch (error) {
            console.error(`Error dropping table: ${error}`);
        }
    });
}
