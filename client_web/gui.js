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
                // if (e.key == "Enter") this.recv_msg(this.nickarea.text(), this.msgarea.val());
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
        // console.log("new nick");
        this.nickarea.text(value)
    }

    async send_msg(msg) {
        // console.log("sending msg");
        await this.client.send(msg);
        this.msgarea.val("");
    }
}
