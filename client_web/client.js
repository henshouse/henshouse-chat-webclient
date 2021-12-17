class Client {
	constructor(ip, port, onmsg, setnick) {
		this.ip = ip;
		this.port = port;
		this.addr = (ip, port);
		this.onmsg = onmsg;
		this.setnick = setnick;
	}

	async init() {
		this.asym = await Asymmetric.new();
		this.socket = new WebSocket(`ws://${this.ip}:${this.port}/`);

		this.socket.onopen = async (_) => {
			this.socket.onmessage = async (ev) => {
				this.socket.onmessage = async (event) => {
					this.setnick(await new Response(event.data).text());

					this.socket.onmessage = async (event) => {
						const text_en = await new Response(event.data).arrayBuffer();
						const text_byte = await this.asym.decrypt(text_en);
						// console.log(text_byte);
						const text = new TextDecoder("UTF-8").decode(text_byte);
						const [me, nick, content] = text.split(NAME_SPLITTER);
						this.onmsg(nick, content);

						this.setnick(me);
						return false;
					};
				};
				const key_str = await new Response(ev.data).arrayBuffer();
				this.remote_key = await Asymmetric.import(key_str);
			};
			const exported_key = await this.asym.export_public();

			this.socket.send(exported_key);
		};
	}

	async send(msg) {
		await this.socket.send(msg);
	}

	async send_str(msg) {
		const array_msg = new TextEncoder("utf-8").encode(msg);
		const encrypted = await this.remote_key.encrypt(array_msg);
		console.log(`encryped: ${encrypted}`);
		await this.socket.send(encrypted);
	}
}

class Asymmetric {
	public = null;
	private = null;

	static async new() {
		const key = new Asymmetric();

		const pair = await window.crypto.subtle.generateKey(
			{
				name: "RSA-OAEP",
				hash: "SHA-256",
				modulusLength: 2048,
				publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			},
			true,
			["decrypt", "encrypt"]
		);
		key.private = pair.privateKey;
		key.public = pair.publicKey;

		return key;
	}

	static async import(public_key, private_key) {
		public_key = await window.crypto.subtle.importKey(
			"spki",
			public_key,
			{ name: "RSA-OAEP", hash: "SHA-256" },
			true,
			["encrypt"]
		);
		let key = new Asymmetric();
		key.public = public_key;
		if (private_key) {
			key.private = await window.crypto.subtle.importKey(
				"spki",
				private_key,
				{ name: "RSA-OAEP", hash: "SHA-256" },
				true,
				["encrypt"]
			);
		}

		return key;
	}

	async export_public() {
		return await window.crypto.subtle.exportKey("spki", this.public);
	}

	async encrypt(msg) {
		return await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, this.public, msg);
	}

	async decrypt(msg) {
		return await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, this.private, msg);
	}

	// async export_both() {
	// 	if (this.private) {
	// 		return (
	// 			await Asymmetric.crypto.cryptoPublicToPem(this.public),
	// 			await Asymmetric.crypto.cryptoPrivateToPem(this.private)
	// 		);
	// 	}

	// 	return await Asymmetric.crypto.cryptoPublicToPem(this.public), null;
	// }
}
