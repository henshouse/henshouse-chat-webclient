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
						const text_en = await new Response(event.data).arrayBuffer();
						const text_byte = await this.asym.decrypt(text_en);
						console.log(text_byte);
						const text = new TextDecoder('UTF-8').decode(text_byte);
						const [me, nick, content] = text.split(NAME_SPLITTER);
						this.onmsg(nick, content);

						this.setnick(me);
						return false;
					};
				};
				// const key_str = await new Response(ev.data).text();
				const key_str = await new Response(ev.data).arrayBuffer();
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
	static crypto = new OpenCrypto();

	static async new(lenght = 2048) {
		const key = new Asymmetric();

		// let pair = await Asymmetric.crypto.getRSAKeyPair();
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
		console.log(pair);
		// window.crypto.subtle.generateKey();
		key.private = pair.privateKey;
		key.public = pair.publicKey;

		return key;
	}

	static async import(public_key, private_key) {
		// public_key = await Asymmetric.crypto.pemPublicToCrypto(public_key);
		// if (private_key) {
		// 	key.private = await Asymmetric.crypto.pemPrivateToCrypto(private_key);
		// }
		public_key = await window.crypto.subtle.importKey(
			"spki",
			public_key,
			{ name: "RSA-OAEP", hash: "SHA-256" },
			true,
			["encrypt"]
		);
		let key = new Asymmetric();
		key.public = public_key;

		return key;
	}

	async export_public() {
		return await Asymmetric.crypto.cryptoPublicToPem(this.public);
		// return await window.crypto.subtle.
	}

	async encrypt(msg) {
		// return await Asymmetric.crypto.rsaEncrypt(this.public, msg);
		return await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, this.public, msg);
	}

	async decrypt(msg) {
		// return await Asymmetric.crypto.rsaDecrypt(this.private, msg);
		return await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, this.private, msg);
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

function convertPemToBinary(pem) {
	var lines = pem.split("\n");
	var encoded = "";
	for (var i = 0; i < lines.length; i++) {
		if (
			lines[i].trim().length > 0 &&
			lines[i].indexOf("-----BEGIN RSA PRIVATE KEY-----") < 0 &&
			lines[i].indexOf("-----BEGIN RSA PUBLIC KEY-----") < 0 &&
			lines[i].indexOf("-----BEGIN PUBLIC KEY-----") < 0 &&
			lines[i].indexOf("-----END PUBLIC KEY-----") < 0 &&
			lines[i].indexOf("-----BEGIN PRIVATE KEY-----") < 0 &&
			lines[i].indexOf("-----END PRIVATE KEY-----") < 0 &&
			lines[i].indexOf("-----END RSA PRIVATE KEY-----") < 0 &&
			lines[i].indexOf("-----END RSA PUBLIC KEY-----") < 0
		) {
			encoded += lines[i].trim();
		}
	}
	return base64StringToArrayBuffer(encoded);
}

function base64StringToArrayBuffer(b64str) {
	b64str = b64EncodeUnicode(b64str);
	var byteStr = atob(b64str);
	var bytes = new Uint8Array(byteStr.length);
	for (var i = 0; i < byteStr.length; i++) {
		bytes[i] = byteStr.charCodeAt(i);
	}
	return bytes.buffer;
}

function b64EncodeUnicode(str) {
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
			return String.fromCharCode("0x" + p1);
		})
	);
}
