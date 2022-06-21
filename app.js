// npm install express
// npm install socket.io
const express=require("express");
const app=express();

const http=require("http");
const server=http.createServer(app);

const {Server}=require("socket.io");
const io=new Server(server);

var carta_jugada=null;
var total_jugadores;
var jugadores=null;
var cartas=[];
var turno=0;
var direccion;
var posicion_cartas;

io.on('connection',(socket)=>{

	io.on('disconnect',()=>{
		console.log("usuario desconectado");
	});

	socket.on('crear',(jugadores)=>{
		this.jugadores=jugadores;
		this.total_jugadores=jugadores.length;
		socket.emit('crear',null);
		//socket.emit('crear','Ya existe una partida');
	});

	socket.on('unirse',(nombre)=>{
		let done=false;
		for(let a=0; a<this.total_jugadores; a++){
			if(this.jugadores[a].nombre=="..." || this.jugadores[a].nombre==nombre){
				this.jugadores[a].nombre=nombre;
				done=true;
				console.log(this.jugadores);
				socket.emit('unirse',this.cartas,this.jugadores,(a+1));
				io.emit('nuevo_jugador',this.jugadores,(a+1));
				a=this.total_jugadores;
			}
		}
		if(!done){
			socket.emit('error','No hay partida');
		}
	});

	socket.on('datos',(cartas,turno,direccion,posicion_cartas,carta_jugada,jugadores,actualizar=true)=>{
		if(actualizar){
			this.cartas=cartas;
			this.turno=turno;
			this.direccion=direccion;
			this.posicion_cartas=posicion_cartas;
			this.carta_jugada=carta_jugada;
			this.jugadores=jugadores;
			io.emit('datos',this.cartas,this.turno,this.direccion,this.posicion_cartas,this.carta_jugada,this.jugadores,actualizar);
		}else{
			socket.emit('datos',this.cartas,this.turno,this.direccion,this.posicion_cartas,this.carta_jugada,this.jugadores,actualizar);
		}
	});

	socket.on('tomar_monto',(turno,num,conta,cambio)=>{
		if(this.jugadores[this.jugadores.length-1].nombre=="..."){
			socket.emit('error','Faltan jugadores');
		}else{
			io.emit('tomar_monto',turno,num,cambio,conta);
		}	
	});

	socket.on('ponerCarta',(turno,posicion)=>{
		if(this.jugadores[this.jugadores.length-1].nombre=="..."){
			socket.emit('error','Faltan jugadores');
		}else{
			io.emit('ponerCarta',turno,posicion);
		}	
	});

});

// Cargar archivos estáticos
app.use(express.static("cliente"));

// Carga del index
app.get('/',(req,res)=>{
	res.sendFile('cliente/index.html'); // __dirname -> Dirección actual del archivo
});

server.listen(3000,()=>{
	console.log("Activo");
});