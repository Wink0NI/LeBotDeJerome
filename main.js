const Discord = require('discord.js')
const { Collection } = require("discord.js")
const Canvas = require('canvas');
const { Player } = require("discord-player")
const Genius = require("genius-lyrics");

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const { getServer, getXP, getAutorespond, getRandomInt, replace_random, replace, list_contains } = require('./Fonctions/functions');

const { updateServer } = require('./mongodb/server/update');
const { updateXP } = require('./mongodb/xp/update');
const { updateAutorespond } = require('./mongodb/autorespond/update');



const fs = require('fs');
const path = require('path');


const intents = new Discord.IntentsBitField(3276799)
const client = new Discord.Client({ intents })
client.config = require('./config')


// Idées: giveaway, ticket, suggestion, ytb notif,achievement

// Add the player on the client
const player = new Player(client, client.config.opt.discordPlayer);
client.genius = new Genius.Client();
player.extractors.loadDefault();

const loadEvents = require('./Loader/loadEvents')

client.commands = new Discord.Collection()
client.color = 15105570

const commands = [];
client.commands = new Collection();

const commandsPath = path.join(__dirname, "Commandes"); // E:\yt\discord client\js\intro\commands
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute({ client, interaction });
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: "There was an error executing this command" });
    }
});

client.login(client.config.token)
loadEvents(client)

client.canvas = {}
client.canvas.create = Canvas.createCanvas(1024, 500);
client.canvas.context = client.canvas.create.getContext("2d");
client.canvas.context.font = '72px sans-serif';
client.canvas.context.fillStyle = '#ffffff';



client.function = {
    createId: require("./Fonctions/createID")
}





client.on("error", (error) => {
    console.error("An error occurred:", error);
});
client.on('ready', () => {
    // Get all ids of the servers
    const guild_ids = client.guilds.cache.map(guild => guild.id);


    const rest = new REST({ version: '9' }).setToken(client.config.token);
    for (const guildId of guild_ids) {
        rest.put(Routes.applicationGuildCommands("1086300845945131101", guildId), {
            body: commands,
        })
            .then(() => console.log('Successfully updated commands for guild ' + guildId))
            .catch(console.error);
    }

    const totalMembers = client.guilds.cache.map(guild => guild.memberCount).reduce((a, b) => a + b, 0);

    const servers = [];
    client.guilds.cache.forEach(guild => {
        servers.push(guild.name)
    })

    const members = [];
    client.guilds.cache.forEach(guild => {
        guild.members.cache.forEach(member => {
            members.push(member.user.tag)
        })
    })

    const games = [
        "RAID SHADOW LEGENDS",
        "Nord VPN",
        "League of Legends",
        "Express VPN",
        "Jérôme"
    ];



    const status = [
        "idle",
        "dnd",
        "online"
    ]

    // run every 10 seconds
    setInterval(() => {
        // generate random number between 0 and length of array.

        const randomIndexstatus = Math.floor(Math.random() * status.length);
        const randomIndexserver = Math.floor(Math.random() * servers.length);
        const randomIndexuser = Math.floor(Math.random() * members.length);
        const randomIndexgame = Math.floor(Math.random() * games.length);

        const newStatus = status[randomIndexstatus];
        const server = servers[randomIndexserver];
        const newUser = members[randomIndexuser];
        const newGame = games[randomIndexgame];

        const activities = [
            "with the /help command.",
            "It's time to D-D-D-D-Duel !",
            `Currently stalking ${totalMembers} users, not including their mom.`,
            `Invite me ! || I am currently on ${client.guilds.cache.size} servers.`,
            "TypeError: Cannot read property '263985159051804674' of undefined",
            `Shoot, accidentaly leaking server id of ${server}.`,
            `Attempting to find ${newUser}'s IP adress.`,
            `Depression Simulator`,
            `Cette vidéo a éte sponsorisée par ${newGame}.`,
            'Omae wa mou shindeiru.'
        ];
        const randomIndex = Math.floor(Math.random() * activities.length);
        const newActivity = activities[randomIndex];

        client.user.setActivity(newActivity);
        client.user.setStatus(newStatus);
        console.log(newActivity);
    }, 10000);

    console.log(`Logged in as ${client.user.tag}!`)
})



client.on("messageCreate", message => {
    if (message.author.bot || message.channel.type === Discord.ChannelType.DM) return;

    getServer(message.guild)
        .then((server) => {
            getXP(message.guild, message.author)
                .then((user) => {
                    console.log(user, server)
             
            
                    if (Date.now() - user.xp_cooldown >= server.xp_cooldown) {

                        const self_mult_xp = parseFloat(user.xp_boost)
                        const mult_xp = parseFloat(server.xp_mult)
                        const mult_lv = parseFloat(server.xp_need_mult)

                        let level = parseInt(user.level)
                        let xp = parseInt(user.xp) + Math.floor((10 + getRandomInt(level, parseInt(level ** 1.5))) * mult_xp * self_mult_xp) + 1;
                        let niv_suiv = 5 * (level ** 2) + 50 * level + 100
                        niv_suiv = Math.floor(niv_suiv * mult_lv)

                        let change = {
                            xp_cooldown: Date.now(),
                            level:  level,
                            xp: xp
                        }

                        if (niv_suiv <= xp) {
                            while (niv_suiv < xp) {
                                xp -= niv_suiv
                                level += 1
                                niv_suiv = Math.floor((5 * (level ** 2) + 50 * level + 100) * mult_lv)
                            }
                            if (server.lu_channel === "") message.channel.send(server.level_up.replaceAll("$user", message.author).replaceAll("$server", message.guild.name).replaceAll("$level", level))
                            else {
                                let channel = client.channels.cache.get(server.lu_channel)
                                console.log(channel)

                                if (!channel) {
                                    updateServer(message.guild, {
                                        lu_channel: ""
                                    })
                                    message.channel.send(server.level_up.replaceAll("$user", message.author).replaceAll("$server", message.guild.name).replaceAll("$level", level))
                                }
                                else channel.send(server.level_up.replaceAll("$user", message.author).replaceAll("$server", message.guild.name).replaceAll("$level", level))
                                change.level = level
                            }
                            change.xp = xp
                        }
                        updateXP(message.guild, message.author, change)
                    }

                })
                .catch((error) => {
                    // Gestion des erreurs si la promesse est rejetée
                    console.error('Erreur de la promesse :', error);
                });
            if (server.autorespond) {
                getAutorespond(message.guild, message.author, message.content).then((autoresponds) => {
                    console.log(autoresponds, message.content)
                    const server = message.guild.id
                    let limit = 3
                    let limite_boucle = 10

                    let type = []
                    const random = ["{choice1}", "{choice2}", "{choice3}", "{choice4}", "{choice5}"]
                    let msg = false
                    let title = ""
                    let messages = ""
                    let content;

                    for (let i = 0; i < autoresponds.length; i++) {

                        let blacklist = autoresponds[i].blacklist
                        let whitelist = autoresponds[i].whitelist
                        var message_user = []

                        if (limit > 0 && (!blacklist.includes(message.author.id) || (whitelist.includes(message.author.id)))) {
                            switch (autoresponds[i].execution) {

                                case "contains":
                                    messages = autoresponds[i].message


                                    if (messages !== "") {
                                        type = [autoresponds[i].choice1, autoresponds[i].choice2, autoresponds[i].choice3, autoresponds[i].choice4, autoresponds[i].choice5]
                                        while ((messages.includes(random[0]) || messages.includes(random[1]) || messages.includes(random[2]) || messages.includes(random[3]) || messages.includes(random[4])) && limite_boucle > 0) {
                                            for (let rep = 0; rep < type.length; rep++) {
                                                messages = replace_random(random[rep], messages, type[rep])
                                            }
                                            limite_boucle = limite_boucle - 1
                                            if (limite_boucle === 0) {
                                                updateAutorespond(message.guild, autoresponds[i].name, {
                                                    choice1: [],
                                                    choice2: [],
                                                    choice3: [],
                                                    choice4: [],
                                                    choice5: [],
                                                    message: 'error'
                                                })
                                                messages = "error"
                                            }

                                        }
                                        limite_boucle = 10

                                    } else messages = ""
                                    limit = limit - 1
                                    msg = true
                                    break

                                case "endswith":
                                    content = message.content.split(" ")
                                    console.log("tg")
                                    if (autoresponds[i].name === content[content.length - 1]) {
                                        messages = autoresponds[i].message


                                        if (messages !== "") {
                                            type = [autoresponds[i].choice1, autoresponds[i].choice2, autoresponds[i].choice3, autoresponds[i].choice4, autoresponds[i].choice5]
                                            while ((messages.includes(random[0]) || messages.includes(random[1]) || messages.includes(random[2]) || messages.includes(random[3]) || messages.includes(random[4])) && limite_boucle > 0) {
                                                for (let rep = 0; rep < type.length; rep++) {
                                                    messages = replace_random(random[rep], messages, type[rep])
                                                }
                                                limite_boucle = limite_boucle - 1
                                                if (limite_boucle === 0) {
                                                    updateAutorespond(message.guild, autoresponds[i].name, {
                                                        choice1: [],
                                                        choice2: [],
                                                        choice3: [],
                                                        choice4: [],
                                                        choice5: [],
                                                        message: 'error'
                                                    })
                                                    messages = "error"
                                                }

                                            }
                                            limite_boucle = 10

                                        } else messages = ""
                                        limit = limit - 1
                                        msg = true
                                    }
                                    break




                                case "exact":
                                    messages = autoresponds[i].message


                                    if (messages !== "") {
                                        type = [autoresponds[i].choice1, autoresponds[i].choice2, autoresponds[i].choice3, autoresponds[i].choice4, autoresponds[i].choice5]
                                        while ((messages.includes(random[0]) || messages.includes(random[1]) || messages.includes(random[2]) || messages.includes(random[3]) || messages.includes(random[4])) && limite_boucle > 0) {
                                            for (let rep = 0; rep < type.length; rep++) {
                                                messages = replace_random(random[rep], messages, type[rep])
                                            }
                                            limite_boucle = limite_boucle - 1
                                            if (limite_boucle === 0) {
                                                updateAutorespond(message.guild, autoresponds[i].name, {
                                                    choice1: [],
                                                    choice2: [],
                                                    choice3: [],
                                                    choice4: [],
                                                    choice5: [],
                                                    message: 'error'
                                                })
                                                messages = "error"
                                            }

                                        }
                                        limite_boucle = 10

                                    } else messages = ""
                                    limit = limit - 1
                                    msg = true
                                    break

                                default:
                                    content = message.content.split(" ")
                                    console.log(autoresponds[i].execution)
                                    if (autoresponds[i].name === content[0]) {
                                        messages = autoresponds[i].message
                                        if (autoresponds[i].embed) title = autoresponds[i].title
                                        let mention = autoresponds[i].user_mention
                                        let users = []
                                        if (mention > 0) {
                                            try {
                                                for (let user = 1; user < mention + 1; user++) {
                                                    message_user.push(`{user${user}}`)

                                                    utilisateur = content[user].replace('<@', '').replace('>', '')
                                                    let member = message.guild.members.cache.get(utilisateur)
                                                    if (!member) return message.reply(`Erreur Autorespond ${autoresponds[i].name}: ${utilisateur} est un utilisateur invalide.`)
                                                    if (isNaN(utilisateur)) return message.reply(`Erreur Autorespond ${autoresponds[i].name}: ${utilisateur} est un utilisateur invalide.`)
                                                    users.push(utilisateur)

                                                }

                                            } catch (err) {
                                                let count = `${mention - users.length} utilisateur`
                                                if (mention - users.length > 1) count += "s"
                                                return message.reply(`Erreur Autorespond ${autoresponds[i].name}: Entrée mention invalide. Manque ${count}.`)
                                            }
                                            limit -= 2
                                        }

                                        if (messages !== "") {
                                            type = [autoresponds[i].choice1, autoresponds[i].choice2, autoresponds[i].choice3, autoresponds[i].choice4, autoresponds[i].choice5]
                                            while ((messages.includes(random[0]) || messages.includes(random[1]) || messages.includes(random[2]) || messages.includes(random[3]) || messages.includes(random[4])) && limite_boucle > 0) {
                                                for (let rep = 0; rep < type.length; rep++) {
                                                    messages = replace_random(random[rep], messages, type[rep])
                                                }
                                                limite_boucle = limite_boucle - 1
                                                if (limite_boucle === 0) {
                                                    updateAutorespond(message.guild, autoresponds[i].name, {
                                                        choice1: [],
                                                        choice2: [],
                                                        choice3: [],
                                                        choice4: [],
                                                        choice5: [],
                                                        message: 'error'
                                                    })
                                                    messages = "error"
                                                }

                                            }
                                            if (limite_boucle > 0) {
                                                while (list_contains(messages, message_user)) {
                                                    for (let user = 0; user < message_user.length; user++) {
                                                        messages = replace(message_user[user], messages, users[user])
                                                    }
                                                }
                                            }
                                            limite_boucle = 10

                                        } else messages = ""

                                    }
                                    limit = limit - 1
                                    msg = true
                            }
                            if (msg === true) {
                                msg = false
                                if (autoresponds[i].embed) {
                                    title = autoresponds[i].title !== "" ? autoresponds[i].title : "title"

                                    while ((title.includes(random[0]) || title.includes(random[1]) || title.includes(random[2]) || title.includes(random[3]) || title.includes(random[4])) && limite_boucle > 0) {
                                        for (let rep = 0; rep < type.length; rep++) {
                                            title = replace_random(random[rep], title, type[rep])
                                        }
                                        limite_boucle = limite_boucle - 1
                                        if (limite_boucle === 0) {
                                            updateAutorespond(message.guild, autoresponds[i].name, {
                                                choice1: [],
                                                choice2: [],
                                                choice3: [],
                                                choice4: [],
                                                choice5: [],
                                                title: 'error'
                                            })
                                            title = "error"
                                        }
                                    }

                                    if (limite_boucle > 0 && autoresponds[i].execution === "startswith") {
                                        while (list_contains(title, message_user)) {
                                            for (let user = 0; user < message_user.length; user++) {
                                                title = replace(message_user[user], title, users[user])
                                            }
                                        }
                                    }

                                    limite_boucle = 10

                                    message.channel.send({
                                        embeds: [new Discord.EmbedBuilder()
                                            .setTitle(title)
                                            .setAuthor({
                                                name: message.author.tag,
                                                iconURL: message.author.displayAvatarURL()
                                            })
                                            .setFooter({
                                                text: client.user.tag,
                                                iconURL: client.user.displayAvatarURL()
                                            })
                                            .setColor(000000255)
                                            .setTimestamp(Date.now())
                                            .setDescription(messages)]

                                    })
                                } else message.channel.send(messages)

                                if (autoresponds[i].giverole.length > 0) {
                                    for (const evenement of autoresponds[i].giverole) {
                                        role = message.guild.roles.cache.get(evenement[0])
                                        utilisateur = message.guild.members.cache.get(evenement[1])
                                        if (!role && !utilisateur) continue

                                        let highest_bot_role = client.guilds.cache.get(message.guild.id).members.cache.get(client.user.id).roles.highest
                                        if (highest_bot_role.comparePositionTo(role) >= 0) continue;

                                        if (!utilisateur.roles.cache.get(role.id)) try {
                                            utilisateur.roles.add(role)
                                        } catch (e) { continue }



                                    }

                                }

                                if (autoresponds[i].removerole.length > 0) {

                                    for (const evenement of autoresponds[i].removerole) {
                                        role = message.guild.roles.cache.get(evenement[0])
                                        utilisateur = message.guild.members.cache.get(evenement[1])
                                        if (!role && !utilisateur) continue

                                        let highest_bot_role = client.guilds.cache.get(message.guild.id).members.cache.get(client.user.id).roles.highest
                                        if (highest_bot_role.comparePositionTo(role) < 0) continue;


                                        if (utilisateur.roles.cache.get(role.id)) try {
                                            utilisateur.roles.remove(role)
                                        } catch (e) { continue }

                                    }
                                }
                            }
                        }

                    }
                })


            }
        })
        .catch((error) => {
            // Gestion des erreurs si la promesse est rejetée
            console.error('Erreur de la promesse :', error);
        });







})
