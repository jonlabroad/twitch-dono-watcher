const regexes: Record<string, any> = {
    joplaysviolin: /. (?<username>.+) just tipped \$(?<amount>.+)\!/,
    
    // HoagieMan5000 just tipped $36.37 THANK YOU :green_heart: :dizzy:
    thesongery: /(?<username>\S+).+\$(?<amount>[0-9]\.[0-9].)/
}

export default class StreamElements {
    public static getDonoRegex(channel: string) {
        const channelName = channel.replace("#", "").toLowerCase();
        const regex = regexes[channelName];
        return regex;
    }
}