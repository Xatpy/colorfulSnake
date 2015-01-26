$(document).on('ready', function() {
	//Vamos a crear un contexto 2d de nuestro canvas.
	var canvas = $("#snake")[0];
	var context = canvas.getContext("2d");
 
	//Obtenemos el ancho y alto de nuestro canvas.
	var width = $("#snake").width();
	var height = $("#snake").height();

	var state = "playing";
	var pause = false;

	//Definimos algunas variables para configurar nuestro juego
	var cellWidth = 10;
	var d; 		//direction
	var old_direction;
	
	var food;
	var listFood = [];
	var numFood = 10;


	var score;
	var level = 10; //1 El nivel más lento, 10 el nivel más rápido.
	var background = 'white';
	var border = 'black';
	var snakeColor = 'black';

	//Creamos nuestra víbora
	var snake;

	//El juego tiene la dirección "right" por defecto y se ejecuta la función paint
	//dependiendo el nivel que hayas configurado arriba
	function init()
	{
		d = "right";
		createSnake();
		createFood();
		createRandomListFood();
		score = 0;
		if (typeof gameLoop != "undefined") {
			clearInterval(gameLoop);
		}
		 
		//game speed
		gameLoop = setInterval(update, 1000 / level);
	}
 
	init();

	//Creamos la víbora
	function createSnake()
	{
		var length = 5;
		snake = [];
 
		for(var i = length - 1; i >= 0; i--)
		{
			snake.push({ x: i, y: 0 });
		}
	}

	//Reference: http://stackoverflow.com/questions/1152024/best-way-to-generate-a-random-color-in-javascript
	function createRandomColor() {
		return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
	}

	//Creamos la comida de la víbora de manera aleatoria
	function createFood()
	{
		food = {
				x: Math.round(Math.random() * (width - cellWidth) / cellWidth),
				y: Math.round(Math.random() * (height - cellWidth) / cellWidth),
			};
		snakeColor = createRandomColor();
	}


	function existColor(color) {
		for (var i = 0; i < listFood.length; ++i) {
			if (listFood[i].color === color) {
				return true;
			}
		}
		return false;
	}

	function createRandomListFood() {
		listFood = [];
		var colorSnk;
		for (var i = 0; i < numFood; ++i) {
			var colorRnd = createRandomColor();
			while (existColor(colorRnd)) {
				colorRnd = createRandomColor();
			}
			listFood.push( {
					x: Math.round(Math.random() * (width - cellWidth) / cellWidth),
					y: Math.round(Math.random() * (height - cellWidth) / cellWidth),
					color: colorRnd
				});
			if (i === 0) {
				snakeColor = colorRnd;
			}
		}// for 
	}

	//Returns:  0 if it has no eaten. 
	//          1 if it has eaten the correct color
	//         -1 incorrect color
	function hasEatenFood(nx, ny) {
		for (var i = 0; i < numFood; i++) {
			if ( (nx === listFood[i].x) && (ny === listFood[i].y) ) {
				if (listFood[i].color === snakeColor) {
					return 1
				} else {
					return -1;
				}
			}
		}
		return 0;
	}

	function update() {
		if (state === "playing") {
			paint();
		} else if (state === "pause") {
			gameOver();
		}
	}

	function gameOver() {
		console.log("gameOver...pressEnter");
		if (d === "enter") {
			state = "playing";
			init();
		}
	}

	function paint() {
		context.fillStyle = background;
		context.fillRect(0, 0, width, height);
		context.strokeStyle = border;
		context.strokeRect(0, 0, width, height);

		var nx = snake[0].x;
		var ny = snake[0].y;

		//pause = false;

		if (d === "enter") {
			pause = true;
		} else {
			if (old_direction !== undefined) {
				d = old_direction;
				old_direction = undefined;
				pause = false;
			}

			if (d == "right") {
				nx++;
			} else if (d == "left") {
				nx--;
			} else if (d == "up") {
				ny--;
			} else if (d == "down") {
				ny++;
			} 
		}

	if (!pause) {

		if (nx == -1 || nx == width / cellWidth || ny == -1 || ny == height / cellWidth || checkCollision(nx, ny, snake)) {
			//init();
			state = "pause";
			console.log(d);
			return;
		}

		//if(nx == food.x && ny == food.y) {
		var hasEaten = hasEatenFood(nx,ny);
		if (hasEaten !== 0) {
			if (hasEaten === 1) {
				console.log('correct');
			} else {
				console.log('incorrect');
				state = "pause";
				//init();
			}

			var tail = {
				x: nx,
				y: ny
			};
			score++;
			//createFood();
			createRandomListFood();
		} else {
			var tail = snake.pop();	 
			tail.x = nx;
			tail.y = ny;
		}

		snake.unshift(tail);
	}

		for (var i = 0; i < snake.length; i++) {
			var c = snake[i];
			paintCell(c.x, c.y, snakeColor);
		}

		var scoreText = "Score: " + score;
		context.fillText(scoreText, 5, height - 5);

		//paintCell(food.x, food.y, 'red');
		for (var i = 0; i < numFood; ++i) {
			paintCell(listFood[i].x, listFood[i].y, listFood[i].color);
		}
	}

	//Pintamos la celda
	function paintCell(x, y, color)
	{
		context.fillStyle = color;
		context.fillRect(x * cellWidth, y * cellWidth, cellWidth, cellWidth);
		context.strokeStyle = background;
		context.strokeRect(x * cellWidth, y * cellWidth, cellWidth, cellWidth);
	}

	//Verificiamos si hubo alguna colisión (si la hubo el juego se reinicia)
	function checkCollision(x, y, array)
	{
		for(var i = 0; i < array.length; i++)
		{
			if(array[i].x == x && array[i].y == y) {
				return true;
			}
		}	
		return false;
	}

	//Captamos las flechas de nuestro teclado para poder mover a nuestra víbora
	$(document).on('keydown', function(e) {
		var key = e.which;
		if (key == "37" && d != "right") {
			d = "left";
		} else if (key == "38" && d != "down") {
			d = "up";
		} else if (key == "39" && d != "left") {
			d = "right";
		} else if (key == "40" && d != "up") {
			d = "down";
		} else if (key == "13" && d != "enter") {
			old_direction = d;
			d = "enter";
		}
	});
});