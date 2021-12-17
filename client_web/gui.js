class Gui {
	constructor(disconnect, onmsg, client) {
        this.textarea = $(".text-area").first();
        this.nickarea = $(".nick-area").first();
        this.msgarea = $("#msg-inp").first();
		this.disconnect = disconnect;
        this.onmsg = onmsg;
        this.client = client;
        this.msgarea
            .on("keydown", (e) => {
                if (e.key == 'Enter') this.send_msg(this.msgarea.val());
            });
	}

	recv_msg(nick, msg) {
        console.log('recv msg');
		this.textarea.html(this.textarea.html() + `<span class="msg-nick">${nick}</span> > ${msg}<br>`);
	}

    get nick() {
        return this.nickarea.text();
    }

    set nick(value) {
        this.nickarea.text(value)
    }

    async send_msg(msg) {
        await this.client.send_str(msg);
        this.msgarea.val("");
    }
}
