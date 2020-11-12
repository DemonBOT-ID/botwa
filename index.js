const { create, Client } = require('@open-wa/wa-automate')
const figlet = require('figlet')
const options = require('./utils/options')
const { color, messageLog } = require('./utils')
const HandleMsg = require('./HandleMsg')

const start = (Demon = new Client()) => {
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('Demon BOT', { font: 'Ghost', horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color('[DEV]'), color('DemonZ', 'yellow'))
    console.log(color('[~>>]'), color('BOT Started!', 'green'))

    // Mempertahankan sesi agar tetap nyala
    Demon.onStateChanged((state) => {
        console.log(color('[~>>]', 'red'), state)
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') Demon.forceRefocus()
    })

    // ketika bot diinvite ke dalam group
    Demon.onAddedToGroup(async (chat) => {
	const groups = await Demon.getAllGroups()
	// kondisi ketika batas group bot telah tercapai,ubah di file settings/setting.json
	if (groups.length > groupLimit) {
	await Demon.sendText(chat.id, `Sorry, the group on this bot is full\nMax Group is: ${groupLimit}`).then(() => {
	      Demon.leaveGroup(chat.id)
	      Demon.deleteChat(chat.id)
	  }) 
	} else {
	// kondisi ketika batas member group belum tercapai, ubah di file settings/setting.json
	    if (chat.groupMetadata.participants.length < memberLimit) {
	    await Demon.sendText(chat.id, `Sorry, BOT comes out if the group members do not exceed ${memberLimit} people`).then(() => {
	      Demon.leaveGroup(chat.id)
	      Demon.deleteChat(chat.id)
	    })
	    } else {
        await Demon.simulateTyping(chat.id, true).then(async () => {
          await Demon.sendText(chat.id, `Hai minna~, Im Demon BOT. To find out the commands on this bot type ${prefix}menu`)
        })
	    }
	}
    })

    // ketika seseorang masuk/keluar dari group
    Demon.onGlobalParicipantsChanged(async (event) => {
        const host = await Demon.getHostNumber() + '@c.us'
        // kondisi ketika seseorang diinvite/join group lewat link
        if (event.action === 'add' && event.who !== host) {
            await Demon.sendTextWithMentions(event.chat, `Hello, Welcome to the group @${event.who.replace('@c.us', '')} \n\nHave fun with us✨`)
        }
        // kondisi ketika seseorang dikick/keluar dari group
        if (event.action === 'remove' && event.who !== host) {
            await Demon.sendTextWithMentions(event.chat, `Good bye @${event.who.replace('@c.us', '')}, We'll miss you✨`)
        }
    })

    Demon.onIncomingCall(async (callData) => {
        // ketika seseorang menelpon nomor bot akan mengirim pesan
        await Demon.sendText(callData.peerJid, '*Maaf sedang tidak bisa menerima panggilan.*\n\n*-bot*')
        .then(async () => {
            // bot akan memblock nomor itu
            await Demon.contactBlock(callData.peerJid)
        })
    })

    // ketika seseorang mengirim pesan
    Demon.onMessage(async (message) => {
        Demon.getAmountOfLoadedMessages() // menghapus pesan cache jika sudah 5000 pesan.
            .then((msg) => {
                if (msg >= 5000) {
                    console.log('[Demon]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    Demon.cutMsgCache()
                }
            })
        HandleMsg(Demon, message)    
    
    })
	
    // Message log for analytic
    Demon.onAnyMessage((anal) => { 
        messageLog(anal.fromMe, anal.type)
    })
}

//create session
create(options(true, start))
    .then((Demon) => start(Demon))
    .catch((err) => new Error(err))
