import { NAME_SPLITTER } from "./constants.js";
import { Asymmetric, Symmetric } from "./security.js";

export default class Client {
	constructor(ip, port, onmsg, setnick, disconnect) {
		this.ip = ip;
		this.port = port;
		this.addr = (ip, port);
		this.onmsg = onmsg;
		this.setnick = setnick;
		this.disconnect = disconnect;
	}

	async init() {
		this.asym = await Asymmetric.new();
		this.socket = new WebSocket(`ws://${this.ip}:${this.port}/`);

		this.socket.onmessage = async (event) => {
			if (!this.remote_key) {
				this.remote_key = true;
				const key_bytes = await new Response(event.data).arrayBuffer();
				this.remote_key = await Asymmetric.import(key_bytes);
			} else if (!this.sym) {
				const key_data = await this.asym.decrypt(
					await new Response(event.data).arrayBuffer()
				);
				this.sym = new Symmetric(key_data);
			} else {
				const text_en = await new Response(event.data).arrayBuffer();
				const text_bytes = await this.sym.decrypt(text_en);
				const text = new TextDecoder("UTF-8").decode(text_bytes);

				const obj = JSON.parse(text);

				this.onmsg(obj.author, obj['content']);
				this.setnick(obj.recipient);
			}

			return false;
		};

		this.socket.onopen = async (_) => {
			const exported_key = await this.asym.export_public();
			this.socket.send(exported_key);
		};

		this.socket.onclose = (_) => {
			this.disconnect();
		};
	}

	async send(msg) {
		await this.socket.send(msg);
	}

	async send_str(msg_content) {
		let obj;

		if (msg_content.charAt(0) === "/") {
			const cmd = msg_content.substring(1).split(" ")[0];
			const args = msg_content.substring(1).split(" ").slice(1).join(" ");
			obj = { type: "command", command: cmd, command_args: args };
		} else {
			obj = { type: "message", content: msg_content };
		}
		const msg = JSON.stringify(obj);
		const bytes_msg = new TextEncoder("utf-8").encode(msg);
		const encrypted = await this.sym.encrypt(bytes_msg);
		await this.socket.send(encrypted);
	}
}
