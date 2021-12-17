let gui;
let client = new Client(
	"10.0.1.17",
	25017,
	(_, __) => {},
	(_) => {}
);
client.init().then(() => {
	// Create gui handler and add events to client
	let gui = new Gui(null, null, client);
	client.setnick = (me) => (gui.nick = me);
	client.onmsg = (nick, content) => gui.recv_msg(nick, content);

	// client.setnick(nick);
});
