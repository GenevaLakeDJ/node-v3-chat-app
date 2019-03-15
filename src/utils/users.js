const users = []

const addUser = ( {id, username, room} ) => {
    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required.'
        }
    }

    // Check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // Validate username
    if (existingUser) {
        return {
            error: 'Username is already in use.'
        }
    }

    // Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    // .find returns the item, .findIndex returns the position (or -1 for no result)
    const index = users.findIndex((user) => {
        return user.id === id
    })

    if (index !== -1) {
        // Splice is returning an array, so we take the first item in that array
        // could have used filter, but disadvantageous because filter would keep running after match is found
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    // .find returns the item, .findIndex returns the position (or -1 for no result)
    return users.find((user) => {
        return user.id === id
    })
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => {
        return user.room === room
    })
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}