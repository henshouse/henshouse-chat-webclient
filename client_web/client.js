class Client {
	constructor(ip, port, onmsg, setnick) {
		this.ip = ip;
		this.port = port;
		this.addr = (ip, port);
		this.onmsg = onmsg;
		this.setnick = setnick
	}

	async init() {
		this.asym = await Asymmetric.new();
		console.log(await this.asym.export_public());
		this.socket = new WebSocket(`ws://${this.ip}:${this.port}/`);
		this.socket.onopen = async (ev) => {
			console.log(ev);
			const exported_key = await this.asym.export_public();
			this.socket.send(exported_key);
			this.socket.onmessage = async (event) => {
				// console.log(`Message: ${event.data}`);
				const text = await new Response(event.data).text();
				const [me, nick, content] = text.split(NAME_SPLITTER);
				this.onmsg(nick, content);
				this.setnick(me);
				// console.log(`msg object type: ${typeof event.data}`);
				// console.log(`msg: ${text}`);
				return false;
			};
		};
	}

	async send(msg) {
		// console.log("sending 2");
		await this.socket.send(msg);
		// console.log("sending 3");
	}

	// async send_str(msg) {
	// 	await this.send(this.asym.public);
	// }
}

class Asymmetric {
	public = null;
	private = null;
	crypto = null;

	static async new(lenght = 2048) {
		let key = new Asymmetric();
		let crypto = new OpenCrypto();
		console.log(crypto.getRSAKeyPair);
		let pair = await crypto.getRSAKeyPair(2048, "SHA-1");
		console.log(pair);
		key.private = pair.privateKey;
		key.public = pair.publicKey;
		key.crypto = crypto;

		return key;
	}

	static async import() {}

	async export_public() {
		return await this.crypto.cryptoPublicToPem(this.public);
	}

	export_both() {}
}
