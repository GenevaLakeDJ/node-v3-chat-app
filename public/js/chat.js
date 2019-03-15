const socket = io()

// name countUpdated needs to match index.js
// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated', count)
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked')
//     socket.emit('increment')
// })

// Elements - $ is a convention that indicates the variable is an element from the DOM
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
// with the below, you can create the whole thing as a variable or you can destruct it, which is what we did below
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    // These get the margin height
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    // offsetHeight does not account for margin so need to add
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight
    
    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled? - scrollTop gives me how far from the top have I scrolled.  There is no scrolled bottom.
    const scrollOffset = $messages.scrollTop + visibleHeight

    // need to subtract newMessageHeight because we run this after the new message.  so if we don't subtract it, we will never be at the bottom and the autoscroll will never run.
    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message.url)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// When we listen for form submissions, we get access to the (e) argument

$messageForm.addEventListener('submit', (e) => {
    // Prevent default behavior where the whole browser refreshes
    e.preventDefault()
    
    // setAttribute allows us to set attributes on our HTML elements (do DOM manipulation)
    // value 'disabled' is the same as attribute name 'disabled'
    $messageFormButton.setAttribute('disabled', 'disabled')

    // This pulls the "message" name from the html form
    const message = e.target.elements.message.value

    // first argument is name, second and beyond are available to the function on the server
    // Last argument is acknowledgement function, with argument that is received from the server
    socket.emit('sendMessage', message, (error) => {
        // enables button regardless of error, sets value to '', puts cursor inside text box
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('The message was delivered!', message)
    })
})

// document.querySelector('#sendInputText').addEventListener('click', () => {
//     console.log('Clicked')
//     const inputMessage = document.getElementById('inputText').value
//     socket.emit('sendMessage', inputMessage)
// })

// socket.on('pushMessage', (inputMessage) => {
//     console.log(inputMessage)
// })

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        // could use a modal instead of alert
        return alert('Geolocation is not supported by your browser.')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    // getCurrentPosition is asynchronous but doesn't support promise API or async await
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared!')
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})