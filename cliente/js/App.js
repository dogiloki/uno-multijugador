var cartas=[];
var tableros=[];
var carta_monto;
var carta_jugada=null;
var template_tablero=document.getElementById('template-tablero').content;
var template_carta=document.getElementById('template-carta').content;
var content_inicio=document.getElementById('content-inicio');
var content_juego=document.getElementById('content-juego');
var content_monto=document.getElementById('content-monto');
var content_jugada=document.getElementById('content-jugada');
var content_turno=document.getElementById('content-turno');
var btn_jugar=document.getElementById('btn-jugar');
var btn_unirse=document.getElementById('btn-unirse');
var caja_nombre=document.getElementById('caja-nombre');
var caja_jugadores=document.getElementById('caja-jugadores');
var nombre;
var total_jugadores;
var turno=0;
var direccion=1;
var posicion_cartas=0;
var jugadores=[];
var clases_tableros=[
	"tablero-abajo",
	"tablero-der",
	"tablero-arriba",
	"tablero-izq"
];
var socket;

document.addEventListener("DOMContentLoaded",()=>{
	this.socket=io();
	// Generar cartas
	let conta=0; // Conteo de cartas totales
	// Cartas normales
	// 2 del 1-9 en cada color
	// 1 de 0 en cada color
	// Carta de reversa, mas2, bloqueo
	// 2 cada color
	for(let a=0; a<5; a++){
		(Diccionario.colores).forEach((color)=>{
			let inicio=(a==0 || a>=2)?0:
						(a==1)?1:0;
			let fin=(a<=1)?9:1;
			for(let b=inicio; b<=fin; b++){
				let carta={
					numero:null,
					color:color,
					tipo:Diccionario.tipo[(a<=1)?0:a-1], // normal; reversa; mas2; bloqueo
					especial:null, // cambio; mas4
					jugador:0 // 0=monto de cartas; -1=ya jugadas; 1-4=jugador
					/*aumento:()=>{
						return (this.tipo==Diccionario.tipo[2])?(2):
								((this.especial==Diccionario.especial[1])?4:0);
					}*/
				};
				if(carta.tipo==Diccionario.tipo[0]){
					carta.numero=b;
				}
				this.cartas.push(carta);
				conta++;
			}
		});
	}
	// 4 mas4 y de cambio (pendiente)
	// Carta para mostrar en el monto
	this.template_carta.getElementById("carta").setAttribute("name","cartas_monto");
	this.template_carta.getElementById("carta").style.background="#353535";
	this.template_carta.getElementById("num1").textContent="";
	this.template_carta.getElementById("num2").textContent="";
	this.template_carta.getElementById("num3").textContent="UNO";
	this.template_carta.getElementById("centro").style.background="#b0160b";
	this.template_carta.getElementById("centro").style.color="#c3c80d";
	this.content_monto.appendChild(this.template_carta.cloneNode(true));
	this.carta_monto=document.getElementsByName("cartas_monto")[0];
	this.carta_monto.addEventListener("click",()=>{
		this.enviarTomarMonto();
	});
});

btn_jugar.addEventListener("click",()=>{
	this.total_jugadores=this.caja_jugadores.value;
	this.nombre=this.caja_nombre.value;
	if(Util.esNumero(this.total_jugadores) && !Util.esDecimal((this.total_jugadores)) && this.total_jugadores<=Diccionario.max_jugadores && this.total_jugadores>0 && this.nombre.replaceAll(" ","")!="" && this.nombre.replaceAll(" ","")!="..."){
		this.barajear(this.cartas);
		for(let a=0; a<this.total_jugadores; a++){
			this.jugadores[a]={
				nombre:"...",
				cartas:Diccionario.num_cartas
			};
		}
		this.jugadores[0]={
			nombre:this.nombre,
			cartas:Diccionario.num_cartas
		};
		this.servidor();
		this.socket.emit('crear',this.jugadores);
	}else{
		alert("Datos no válidos");
	}
});
btn_unirse.addEventListener('click',()=>{
	this.nombre=this.caja_nombre.value;	
	if(this.nombre.replaceAll(" ","")=="" || this.nombre.replaceAll(" ","")=="..."){
		alert("Nombre no válido");
	}else{
		this.servidor();
		this.socket.emit('unirse',this.nombre);
	}
});

function servidor(){
	// Servidor
	this.socket.on('error',(msg)=>{
		alert(msg);
	});
	this.socket.on('crear',(msg)=>{
		if(msg!=null){
			alert(msg);
		}else{
			this.juego();
			this.socket.emit('datos',this.cartas,this.turno,this.direccion,this.posicion_cartas,this.carta_jugada,this.jugadores);
		}
	})
	this.socket.on('unirse',(cartas,jugadores,turno)=>{
		this.cartas=cartas;
		this.jugadores=jugadores;
		this.total_jugadores=jugadores.length;
		this.turno=turno;
		this.juego();
		this.socket.emit('datos',null,null,null,null,null,null,false);
	});
	this.socket.on('nuevo_jugador',(jugadores,posicion)=>{
		this.total_jugadores=jugadores.length;
		this.jugadores=jugadores;
		document.getElementsByName('num_cartas'+posicion)[0].textContent=this.jugadores[posicion-1].nombre+" - "+this.jugadores[posicion-1].cartas;
	});
	this.socket.on('datos',(cartas,turno,direccion,posicion_cartas,carta_jugada,jugadores,actualizar)=>{
		this.cartas=cartas;
		this.turno=turno;
		this.direccion=direccion;
		this.posicion_cartas=posicion_cartas;
		this.carta_jugada=carta_jugada;
		this.jugadores=jugadores;
		// Poner carta jugada
		if(this.carta_jugada!=null){
			this.content_jugada.innerHTML="";
			this.content_jugada.appendChild(this.crearCarta(this.carta_jugada));
		}
		// Poner turno actual
		this.content_turno.textContent=((this.direccion==0)?"<~":"~>")+" Turno de "+this.jugadores[this.turno-1].nombre;
	});
	this.socket.on('tomar_monto',(turno,num,cambio,conta)=>{
		this.turno=turno;
		this.tomarMonto(num,cambio,conta);
		this.socket.emit('datos',this.cartas,this.turno,this.direccion,this.posicion_cartas,this.carta_jugada,this.jugadores);
	});
	this.socket.on('ponerCarta',(turno,posicion)=>{
		this.turno=turno;
		this.ponerCarta(posicion);
		this.socket.emit('datos',this.cartas,this.turno,this.direccion,this.posicion_cartas,this.carta_jugada,this.jugadores);
	});
}

function modal(content,visible=-1){
	content.style.display=(visible==-1)?
						((content.style.display=="none")?"":"none"):
						(visible)?"":"none";
}

function inicio(){
	this.modal(content_inicio,true);
	this.modal(content_juego,false);
}

function juego(){
	this.posicion_cartas=0;
	this.generarTableros();
	this.cambiarTurno();
	this.modal(content_inicio,false);
	this.modal(content_juego,true);
}

function crearCarta(posicion,volteada=false){
	let carta=this.cartas[posicion];
	this.template_carta.getElementById("carta").style.background=(volteada)?"#353535":carta.color;
	this.template_carta.getElementById("centro").style.color=(volteada)?"#b0160b":carta.color;
	this.template_carta.getElementById("centro").style.background=(volteada)?"#c3c80d":"#ffffff";
	if(carta.tipo==Diccionario.tipo[0]){
		aisgnarNumero(carta.numero);
	}else
	if(carta.tipo==Diccionario.tipo[1]){
		aisgnarNumero("R");
	}else
	if(carta.tipo==Diccionario.tipo[2]){
		aisgnarNumero("+2");
	}else
	if(carta.tipo==Diccionario.tipo[3]){
		aisgnarNumero("B");
	}
	function aisgnarNumero(num){
		num+="";
		carta.numero=num;
		if(volteada){
			this.template_carta.getElementById("num1").textContent="";
			this.template_carta.getElementById("num2").textContent="";
			this.template_carta.getElementById("num3").textContent="UNO";
		}else{
			this.template_carta.getElementById("num1").textContent=num;
			this.template_carta.getElementById("num2").textContent=num;
			this.template_carta.getElementById("num3").textContent=num.indexOf("+")==-1?num:num.substring(0,1);
		}
	}
	this.template_carta.getElementById("carta").setAttribute("name","carta"+posicion);
	this.template_carta.getElementById("carta").setAttribute("onclick","enviarPonerCarta('"+posicion+"')");
	return this.template_carta.cloneNode(true);
}

function barajear(cartas){
	this.cartas=[];
	let conta=0;
	(Util.numeroAleatorio(cartas.length-1,0,cartas.length)).forEach((posicion)=>{
		this.cartas.push(cartas[posicion]);
		conta++;
	});
}

function generarTableros(){
	// Repartir cartas a los jugadores
	for(let a=0; a<this.total_jugadores; a++){
		let tablero=this.template_tablero.getElementById("tablero");
		this.template_tablero.getElementById("num_cartas").textContent=this.jugadores[a].nombre+" - "+this.jugadores[a].cartas;
		this.template_tablero.getElementById("num_cartas").setAttribute("name","num_cartas"+(a+1));
		let cartas=this.template_tablero.getElementById("cartas");
		cartas.innerHTML="";	
		tablero.setAttribute("name","tablero"+(a+1));
		cartas.setAttribute("name","cartas"+(a+1));
		for(let b=0; b<this.jugadores[a].cartas; b++){
			/*let numero;
			do{
				numero=Util.numeroAleatorio(this.cartas.length-1);
			}while(this.cartas[numero].jugador!=0);*/
			if(this.cartas[this.posicion_cartas].jugador!=-1 || this.cartas[this.posicion_cartas].jugador==(a+1)){
				this.cartas[this.posicion_cartas].jugador=(a+1);
				cartas.appendChild(this.crearCarta(this.posicion_cartas,this.jugadores[a].nombre!=this.nombre));
			}
			this.posicion_cartas++;
		}
		//this.modal(tablero,this.jugadores[a].nombre==this.nombre);
		this.content_juego.appendChild(tablero.cloneNode(true));
	}
	// Distribuir tableros
	let turno_temp=this.turno;
	let direccion_temp=this.direccion;
	for(let a=0; a<this.total_jugadores; a++){
		if(this.jugadores[a].nombre==this.nombre){	
			this.turno=(a+1);
		}
	}
	this.direccion=1;
	posicionar();
	function posicionar(conta=0){
		let tablero=document.getElementsByName('tablero'+this.turno)[0];
		let cartas=document.getElementsByName('cartas'+this.turno)[0];
		console.log(this.turno," - ",this.clases_tableros[conta]);
		tablero.setAttribute("class","tablero "+this.clases_tableros[conta]);
		cartas.setAttribute("class","cartas "+((conta%2==0)?"cartas_horizontal":"cartas_vertical"));
		cambiarTurno();
		if(conta<this.total_jugadores-1){
			posicionar(conta+1);
		}
	}
	this.turno=turno_temp;
	this.direccion=direccion_temp;
}

function cambiarTurno(){
	if(this.direccion==1){
		if(this.turno<this.total_jugadores){
			this.turno++;
		}else{
			this.turno=1;
		}
	}else{
		if(this.turno>1){
			this.turno--;
		}else{
			this.turno=this.total_jugadores;
		}
	}
	this.content_turno.textContent=((this.direccion==0)?"<~":"~>")+" Turno de "+this.jugadores[this.turno-1].nombre;
}

function enviarTomarMonto(num=1,cambio=false,conta=0){
	if(this.jugadores[this.turno-1].nombre==this.nombre){
		this.socket.emit('tomar_monto',this.turno,num,conta,cambio);
	}
}
function tomarMonto(num=1,cambio=false,conta=0){
	if(conta<num){
		let cartas=document.getElementsByName('cartas'+this.turno)[0];
		let num_cartas=document.getElementsByName('num_cartas'+this.turno)[0];
		this.jugadores[this.turno-1].cartas++;
		num_cartas.innerHTML=this.jugadores[this.turno-1].nombre+" - "+this.jugadores[this.turno-1].cartas;
		cartas.appendChild(this.crearCarta(this.posicion_cartas,this.jugadores[this.turno-1].nombre!=this.nombre));
		this.cartas[this.posicion_cartas].jugador=this.turno;
		if(this.posicion_cartas>=this.cartas.length-1){
			this.content_monto.innerHTML="";
		}
		this.posicion_cartas++;
		if(cambio){
			this.cambiarTurno();
			this.socket.emit('datos',this.cartas,this.turno,this.direccion,this.posicion_cartas,this.carta_jugada);
		}
		this.tomarMonto(num,cambio,conta+1);
	}
}

function enviarPonerCarta(posicion){
	if(this.jugadores[this.turno-1].nombre==this.nombre){
		this.socket.emit('ponerCarta',this.turno,posicion);
	}
}
function ponerCarta(posicion=null){
	if(posicion==null){
		return;
	}
	if(this.cartas[posicion].jugador<1 || this.cartas[posicion].jugador!=this.turno){
		return;
	}
	let num_cartas=document.getElementsByName('num_cartas'+this.turno)[0];
	let carta=this.crearCarta(posicion);
	let done=false;
	if(this.carta_jugada!=null){
		if(this.cartas[posicion].numero==this.cartas[this.carta_jugada].numero || this.cartas[posicion].color==this.cartas[this.carta_jugada].color){
			done=true;
		}
	}else{
		done=true;
	}
	if(done){
		document.getElementsByName('carta'+posicion)[0].remove();
		this.content_jugada.innerHTML="";
		this.carta_jugada=posicion;
		this.content_jugada.appendChild(carta);
		this.cartas[posicion].jugador=-1;
		this.jugadores[this.turno-1].cartas--;
		num_cartas.innerHTML=this.jugadores[this.turno-1].nombre+" - "+this.jugadores[this.turno-1].cartas;
		if(this.cartas.filter((carta)=>carta.jugador==this.turno).length<=0){
			alert("Gano el jugador "+this.turno);
			return;
		}
		switch(this.cartas[posicion].tipo){
			case Diccionario.tipo[0]: this.cambiarTurno(); break;
			case Diccionario.tipo[1]: this.direccion=this.direccion==0?1:0; this.cambiarTurno(); break;
			case Diccionario.tipo[2]: this.cambiarTurno(); this.tomarMonto(2); break;
			case Diccionario.tipo[3]: this.cambiarTurno(); this.cambiarTurno(); break;
		}
	}
}