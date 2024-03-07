module.exports = {
    token : "MTA4NjMwMDg0NTk0NTEzMTEwMQ.GD9pm1.JIToXtPV2biSI6DYNDoPsyqFlY7GZTYSw0-TE8",
    apiKey: "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",

    app: {
        playing: 'by 0NITE',
        global: true,
        ExtraMessages: false,
        loopMessage: false,

    },

    opt: {
        DJ: {
            enabled: false,
            roleName: '',
            commands: []
        },
        maxVol: 100,
        spotifyBridge: true,
        volume: 1,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 5000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 60000,
        discordPlayer: {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            }
        }
    }

}