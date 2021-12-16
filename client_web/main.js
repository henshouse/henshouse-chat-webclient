let gui;
let nick;
let client = new Client("10.0.1.17", 25017, () => {}, () => {});
client.init().then(() => {
	let gui = new Gui(null, null, client);
	client.setnick = (me) => gui.nick = me;
	// console.log("created gui");
	client.onmsg = (nick_, content) => gui.recv_msg(nick_, content);
	// console.log("new nick event");
	gui.nick = nick;
});
