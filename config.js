const config = {};

config.host = process.env.HOST;
config.authKey = process.env.AUTH_KEY;
config.databaseId = "Sharevana";
config.userContainer = "Users";
config.storyContainer = "Story";
config.chatContainer = "Chats";

config.nodeEnv = process.env.NODE_ENV || "development";
config.jwtSecret = process.env.JWT_SECRET || "thereIsNoSecret";
config.port = process.env.PORT || "3001";
config.azureSqlServer = process.env.AZURE_SQL_SERVER;
config.azureSqlDatabase = process.env.AZURE_SQL_DATABASE;
config.azureSqlPort = process.env.AZURE_SQL_PORT;
config.azureSqlUser = process.env.AZURE_SQL_USER || "shatbox";
config.azureSqlPassword = process.env.AZURE_SQL_PASSWORD;
config.azurePsConnStr = process.env.AZURE_PS_CONN_STR;
config.azurePsHub = process.env.AZURE_PS_HUB;
config.adminKey = process.env.ADMIN_KEY;

export default config;
