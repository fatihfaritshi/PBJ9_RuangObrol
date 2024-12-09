const socket = io()

// Elements
const $messageForm = document.querySelector('#form-pesan')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#kirim-lokasi')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#locationMessage-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

// Function to auto-scroll the message area when a new message is added
const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild
    
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height of the message container
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    // If the user is near the bottom, auto-scroll
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// Listen for incoming text messages
socket.on('pesan', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

// Listen for incoming location messages
socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('H:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

// Listen for room data (room name and users)
socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// Handle form submission for sending messages
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // Disable the send button to prevent multiple submissions
    $messageFormButton.setAttribute('disabled', 'disabled')
    
    const pesan = e.target.elements.pesan.value

    // Emit the message to the server
    socket.emit('kirimPesan', pesan, (error) => {
        // Re-enable the button and clear the input after submission
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Pesan berhasil dikirim')
    })
})

// Handle location sharing button click
$sendLocationButton.addEventListener('click', (e) => {
    if (!navigator.geolocation) {
        return alert('Browser anda tidak mendukung Geolocation')
    }

    // Disable the location button while fetching the location
    $sendLocationButton.setAttribute('disabled', 'disabled')

    // Get current location from the browser
    navigator.geolocation.getCurrentPosition((position) => {
        // Emit the location to the server
        socket.emit('kirimLokasi', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            // Re-enable the location button after sending
            $sendLocationButton.removeAttribute('disabled')
            console.log('Lokasi berhasil dikirim')
        })
    })
})

// Join the room when the page is loaded
socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})