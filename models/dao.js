import { CosmosClient } from "@azure/cosmos";
import config from "../config.js";

let client;
let database;
let userContainer;
let storyContainer;
let chatContainer;

export async function initializeDb() {
    client = new CosmosClient({ endpoint: config.host, key: config.authKey });
    try {
        const dbResponse = await client.databases.createIfNotExists({
            id: config.databaseId,
        });
        database = dbResponse.database;

        const userConRes = await database.containers.createIfNotExists({
            id: config.userContainer,
        });
        userContainer = userConRes.container;

        const storyConRes = await database.containers.createIfNotExists({
            id: config.storyContainer,
        });
        storyContainer = storyConRes.container;

        const chatConRes = await database.containers.createIfNotExists({
            id: config.chatContainer,
        });
        console.log("Initialized database");
        chatContainer = chatConRes.container;
    } catch (error) {
        console.error("Error initializing database", error);
    }
}

export async function executeQuery(collectionName, querySpec) {
    switch (collectionName) {
        case config.userContainer:
            return await userContainer.items.query(querySpec).fetchAll();
        case config.storyContainer:
            return await storyContainer.items.query(querySpec).fetchAll();
        case config.chatContainer:
            return await chatContainer.items.query(querySpec).fetchAll();
    }

    return resources;
}

// Users DAO

export async function getUsers() {
    const querySpec = {
        query: "SELECT * FROM c",
    };
    return await executeQuery(config.userContainer, querySpec);
}

export async function getUserByUsername(username) {
    const querySpec = {
        query: "SELECT * FROM c WHERE c.username = @username",
        parameters: [{ name: "@username", value: username }],
    };
    const { resources } = await executeQuery(config.userContainer, querySpec);
    return resources[0];
}

export async function getUserById(userId) {
    const { resource } = await userContainer.item(userId).read();
    return resource;
}

export async function createUser(user) {
    const { resource } = await userContainer.items.create(user);
    return resource;
}

export async function getRandomUser(userId, chatUserIds) {
    const query = `SELECT c.id, c.username FROM c WHERE c.id != "${userId}" AND c.id NOT IN (${chatUserIds
        .map((item) => `"${item}"`)
        .join(", ")}) OFFSET 0 LIMIT 5`;
    const { resources } = await userContainer.items.query({ query }).fetchAll();
    const length = resources.length;
    const randomIndex = Math.floor(Math.random() * length);
    return resources[randomIndex];
}

export async function addChatToUser(userId, partner, chatId, isUser1) {
    const { resource: user } = await userContainer.item(userId).read();
    if (!user.chats) {
        user.chats = [];
    }
    user.chats.push({ chatId, partnerName: partner.username, isUser1 });
    if (!user.chatUserIds) {
        user.chatUserIds = [];
    }
    user.chatUserIds.push(partner.id);
    const { resource } = await userContainer.item(userId).replace(user);
    return resource;
}

// Story DAO

export async function getAllStory() {
    const { resources } = await storyContainer.items.readAll().fetchAll();
    return resources;
}

export async function createStory(story) {
    const { resource } = await storyContainer.items.create(story);
    return resource;
}

export async function getStoryById(storyId) {
    const { resource } = await storyContainer.item(storyId).read();
    return resource;
}

export async function updateStory(story) {
    const { resource } = await storyContainer.items.upsert(story);
    return resource;
}

export async function deleteStory(storyId) {
    const { resource } = await storyContainer.item(storyId).delete();
    return resource;
}

export async function likeStory(storyId, userId) {
    const { resource } = await userContainer.item(userId).read();
    if (resource.likedStories) {
        if (resource.likedStories.includes(storyId)) {
            return resource;
        }
        resource.likedStories.push(storyId);
    } else {
        resource.likedStories = [storyId];
    }
    const { resource: updatedResource } = await userContainer
        .item(userId)
        .replace(resource);
    return updatedResource;
}

// Chat DAO

export async function createChat(chat) {
    const { resource } = await chatContainer.items.create(chat);
    return resource;
}

export async function getChatById(chatId) {
    const { resource } = await chatContainer.item(chatId).read();
    return resource;
}

export async function insertMessageIntoChat(chatId, message) {
    const { resource } = await chatContainer.item(chatId).read();
    resource.messages.push(message);
    const { resource: updatedResource } = await chatContainer
        .item(chatId)
        .replace(resource);
    return updatedResource;
}

export async function getUserChats(chats) {
    const { resources } = await chatContainer.items
        .query({
            query: "SELECT * FROM c WHERE c.id IN @chats",
            parameters: [{ name: "@chats", value: chats }],
        })
        .fetchAll();
    return resources;
}
