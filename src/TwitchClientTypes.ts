export interface UserData {
    broadcaster_type: string
    created_at: string
    description: string
    display_name: string
    id: string
    login: string
    offline_image_url: string
    profile_image_url: string
    type: string
    view_count: number
}

export interface ChannelData {
    broadcaster_id: string
    broadcaster_language: string
    broadcaster_login: string
    broadcaster_name: string
    game_id: string
    game_name: string
    title: string
}

export interface LiveChannelData {
    broadcaster_language: string
    broadcaster_login: string
    display_name: string
    game_id: string
    game_name: string
    id: string
    is_live: boolean
    started_at: string
    tag_ids: string[]
    thumbnail_url: string
    title: string
}

export interface UserSubscriptions {
    broadcaster_id: string
    broadcaster_name: string
    broadcaster_login: string
    is_gift: boolean
    tier: string
}

export interface UserFollows {
    from_id: string
    from_login: string
    from_name: string
    to_id: string
    to_name: string
    followed_at: string
}

export interface StreamData {
    id: string
    user_id: string
    user_login: string
    user_name: string
    game_id: string
    game_name: string
    type: string
    title: string
    viewer_count: number
    started_at: string
    language: string
    thumbnail_url: string
    tag_ids: string[]
    is_mature: false
}

export interface Game {
    id: string
    name: string
    box_art_url: string
}

export interface UsersFollows {
    total: number,
    data: {
        from_id: string
        from_login: string
        from_name: string
        to_id: string
        to_name: string
        followed_at: string
    }[]
    pagination: {
        cursor: string
    }
}

export interface TwitchSubscription {
    id: string
    status: string
    type: string
    version: string
    cost: string
    condition: {
        broadcaster_user_id: string
    },
    created_at: string
    transport: {
        method: string
        callback: string
    }
}

export interface DataResponse<T> {
    data: T
}

export interface Paginated<T> {
    total: number
    data: T
    pagination: {
        cursor: string
    }
}
