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
		// console.log(await this.asym.export_public());
		this.socket = new WebSocket(`ws://${this.ip}:${this.port}/`);
		this.socket.onopen = async (ev) => {
			// console.log(ev);

			this.socket.onmessage = async (ev) => {
				this.socket.onmessage = async (event) => {
					this.setnick(await new Response(event.data).text());

					this.socket.onmessage = async (event) => {
						const text = await new Response(event.data).text();
						const [me, nick, content] = text.split(NAME_SPLITTER);
						this.onmsg(nick, content);

						this.setnick(me);
						return false;
					};
				};
				const key_str = await new Response(ev.data).text();
				// console.log(`key: ${key_str}`);
				this.remote_key = await Asymmetric.import(key_str);

			};
			const exported_key = await this.asym.export_public();

			this.socket.send(exported_key);

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
	static crypto = new OpenCrypto();

	static async new(lenght = 2048) {
		let key = new Asymmetric();
		// if (!Asymmetric.crypto) {
		// 	Asymmetric.crypto = new OpenCrypto();
		// }
		// console.log(Asymmetric.crypto.getRSAKeyPair);
		let pair = await Asymmetric.crypto.getRSAKeyPair();
		key.private = pair.privateKey;
		key.public = pair.publicKey;

		return key;
	}

	static async import(public_key, private_key) {
		public_key = await Asymmetric.crypto.pemPublicToCrypto(public_key);
		if (private_key) {
			key.private = await Asymmetric.crypto.pemPrivateToCrypto(private_key);
		}
		let key = new Asymmetric();
		key.public = public_key;

		return key;
	}

	async export_public() {
		return await Asymmetric.crypto.cryptoPublicToPem(this.public);
	}

	async export_both() {
		if (this.private) {
			return (
				await Asymmetric.crypto.cryptoPublicToPem(this.public),
				await Asymmetric.crypto.cryptoPrivateToPem(this.private)
			);
		}

		return await Asymmetric.crypto.cryptoPublicToPem(this.public), null;
	}
}
