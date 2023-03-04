export default class Gui {
	constructor(disconnect, connect, send) {
		this._textarea = $(".text-area");
		this._nickarea = $(".nick-area");
		this._msgarea = $("#msg-inp");
		this._ip_input = $(".ip-input");
		this._port_input = $(".port-input");
		this._connect_button = $(".connect-button");
		this._status_dot = $(".status-dot");

		this.disconnect = disconnect;
		this.connect = connect;
		this.send = send;

		this.input_color = "rgb(77, 166, 255)";
		this.input_color_invalid = "red";

		this._msgarea.on("keydown", (e) => {
			if (e.key == "Enter") this.send_msg(this._msgarea.val());
		});

		this._ip_input.on("input propertyChange", async (e) => {
			this.check_ip(e.target.value);
		});

		this._port_input.on("input propertyChange", async (e) => {
			this.check_port(e.target.value);
		});

		this._connect_button.on("click", (ev) => {
			if (this.check_legal()) {
				if (this.connect(this._ip_input.val(), this._port_input.val())) {
					this._status_dot.css("background-color", "lime");
				} else {
					this.show_disconnect();
				}
			} else {
				alert("Invalid Parameters");
			}
		});
	}

	show_disconnect() {
		this._status_dot.css("background-color", "red");
	}

	check_legal() {
		return this.check_ip() & this.check_port();
	}

	check_port(port) {
		if (!port) port = this._port_input.val();
		const portre = /^\d{2,6}$/;
		const islegal = portre.test(port);
		if (islegal) {
			this._port_input.css("border-color", this.input_color);
		} else {
			this._port_input.css("border-color", this.input_color_invalid);
		}

		return islegal;
	}
	check_ip(ip) {
		if (!ip) ip = this._ip_input.val();
		const ipre = /^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/;
		const islegal = ipre.test(ip);
		if (islegal) {
			this._ip_input.css("border-color", this.input_color);
		} else {
			this._ip_input.css("border-color", this.input_color_invalid);
		}

		return islegal;
	}

	recv_msg(nick, msg) {
		console.log("recv msg");
		this._textarea.html(
			this._textarea.html() + `<span class="msg-nick">${nick}</span> > ${msg}<br>`
		);
	}

	get nick() {
		return this._nickarea.text();
	}

	set nick(value) {
		this._nickarea.text(value);
	}

	clear() {
		this._textarea.html("");
	}

	async send_msg(msg) {
		if (msg !== "")
			await this.send(msg);
		this._msgarea.val("");
	}
}
