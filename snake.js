$(document).on('ready', function() {
  	// $('#snake').width(document.body.clientWidth);
  	// $('#snake').height(document.body.clientHeight);

	var canvas = $("#snake")[0];
	var context = canvas.getContext("2d");
 
	//Obtenemos el ancho y alto de nuestro canvas.
	var width = $("#snake").width();
	var height = $("#snake").height();

	var varScreen = true;

	var numCellsWidth, numCellsHeight;

	var state = "playing";
	var pause = false;

	//Global variables
	var cellWidth = 10;
	var d; 		//direction
	var old_direction;
	
	var food;
	var listFood = [];
	var numFood = 10;

	var score;
	var level = 5; //Speed level
	var background = 'white';
	var border = 'black';
	var snakeColor = 'black';

	var snake;

	var textGameOver = [];
	var textPause = [];

	var record = -1;

	var is_touch_device = null;
	var sigCanvas;

	init();

	function init()
	{
		initialSettings();

		initListeners();

		numCellsWidth = width / cellWidth;
		numCellsHeight = height / cellWidth;

		generateTextGameOver();
		generateTextPause();

		resetGame();

		checkRecord(0);
	}

	function resetGame() {
		d = "right";
		old_direction = undefined;

		createSnake();
		//createFood();
		createRandomListFood();
		score = 0;
		if (typeof gameLoop != "undefined") {
			clearInterval(gameLoop);
		}
		 
		//game speed
		gameLoop = setInterval(update, 1000 / level);
	}
 
 	function initialSettings() {
 		if (varScreen) {
	 		//alert('width:' + document.body.clientWidth + '   : height:' + document.body.clientHeight);
	 		var size = (document.body.clientHeight <= document.body.clientWidth ? document.body.clientHeight : document.body.clientWidth);

			var canvas = document.getElementById('snake');
			canvas.width = canvas.height = size;

			width = height = size;
		}
 	}

	function initListeners() {
         is_touch_device = 'ontouchstart' in document.documentElement;

        // attach the touchstart, touchmove, touchend event listeners.
        canvas.addEventListener('touchstart', draw, false);
        canvas.addEventListener('touchmove', draw, false);
        canvas.addEventListener('touchend', draw, false);

        // prevent elastic scrolling
        canvas.addEventListener('touchmove', function (event) {
           event.preventDefault();
        }, false); 
	}

    function draw(event) {

       // get the touch coordinates.  Using the first touch in case of multi-touch
       var coors = {
          x: event.targetTouches[0].pageX,
          y: event.targetTouches[0].pageY
       };

       // Now we need to get the offset of the canvas location
       var obj = sigCanvas;

       if (obj.offsetParent) {
          // Every time we find a new object, we add its offsetLeft and offsetTop to curleft and curtop.
          do {
             coors.x -= obj.offsetLeft;
             coors.y -= obj.offsetTop;
          }
		  // The while loop can be "while (obj = obj.offsetParent)" only, which does return null
		  // when null is passed back, but that creates a warning in some editors (i.e. VS2010).
          while ((obj = obj.offsetParent) != null);
       }

       // pass the coordinates to the appropriate handler
       drawer[event.type](coors);
    }

    //Creating snake
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

	//Creating food RANDOMLY
	function createFood()
	{
		food = {
				x: Math.round(Math.random() * (width - cellWidth) / cellWidth),
				y: Math.round(Math.random() * (height - cellWidth) / cellWidth),
			};
		snakeColor = createRandomColor();
	}


	function existColor(color) {
		var range = 1000000;

		for (var i = 0; i < listFood.length; ++i) {
			var numA = parseInt(listFood[i].color.slice(1,7),16);
			var numB = parseInt(color.slice(1,7),16);
			var rest = Math.abs(numA - numB);

			if (rest < range) {
				return true;
			}
		}
		return false;
	}

	function checkPosition(posRnd) {
		var snakeLength = snake.length;
		for (var i = 0; i < snakeLength; ++i) {
			if ( (snake[i].x === posRnd.x) && (snake[i].y === posRnd.y) ) {
				return true;
			}
		}
		return false;
	}

	function createRandomPosition() {
		var pos = {};
		pos.x = Math.round(Math.random() * (width - cellWidth) / cellWidth);
		pos.y = Math.round(Math.random() * (height - cellWidth) / cellWidth);
		return pos;
	}

	function createRandomListFood() {
		listFood = [];
		var colorSnk;
		for (var i = 0; i < numFood; ++i) {
			var colorRnd = createRandomColor();
			// Check color
			while (existColor(colorRnd)) {
				colorRnd = createRandomColor();
			}
			// Check position
			var posRnd = createRandomPosition();
			while (checkPosition(posRnd)) {
				posRnd = createRandomPosition();
			}

			listFood.push ( {
				x: 		posRnd.x,
				y: 		posRnd.y,
				color: 	colorRnd
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

      // works out the X, Y position of the click inside the canvas from the X, Y position on the page
	function getPosition(mouseEvent, sigCanvas) {
		var x, y;
		if (mouseEvent.pageX != undefined && mouseEvent.pageY != undefined) {
			x = mouseEvent.pageX;
			y = mouseEvent.pageY;
		} else {
			x = mouseEvent.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = mouseEvent.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		return { X: x - canvas.offsetLeft, Y: y - canvas.offsetTop };
	}
    
    function checkQuadrant(position) {
    	// el punto de la posición donde se ha pulsado en el canvas
    	var P = [position.X, position.Y];
    	//Voy a comprobar en qué cuadrante ha dado y lo guardo en la variable result.
    	var dir = "";
    	var centro = [(width / 2), (height / 2)];
    	//Compruebo el cuadrante de la izquierda ||| (0,0) | (heigh,0) | (width/2,height/2)
    	var A = [0,0];
    	var B = [0,height];
    	var C = centro;
    	if (pointInTriange(P,A,B,C)) {
    		dir = "left"; // izquierda
    	} else {
    		//Compruebo en el cuadrante de arriba ||| (0,0) | (centro) | (width, 0)
    		A = [0,0];
    		B = [width, 0];
    		C = centro;
    		if (pointInTriange(P,A,B,C)) {
    			dir = "up"; //arriba
    		} else {
    			//Derecha
    			A = [width, 0];
    			B = centro;
    			C = [width, height];
    			if (pointInTriange(P,A,B,C)) {
    				dir = "right";
    			} else {
    				//Abajo
    				A = [width, height];
    				B = centro;
    				C = [0, height];
    				if (pointInTriange(P,A,B,C)) {
    					dir = "down";
    				}
    			}
    		}
    	}

    	return dir;
    }

    function pointInTriange(P, A, B, C) {
		// Compute vectors        
		function vec(from, to) {  
		return [to[0] - from[0], to[1] - from[1]];  
		}

		// Compute dot products
		function dot(u, v) {  
		return u[0] * v[0] + u[1] * v[1];  
		}

		var v0 = vec(A, C);
		var v1 = vec(A, B);
		var v2 = vec(A, P);

		var dot00 = dot(v0, v0);
		var dot01 = dot(v0, v1);
		var dot02 = dot(v0, v2);
		var dot11 = dot(v1, v1);
		var dot12 = dot(v1, v2);
		// Compute barycentric coordinates
		var invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
		var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
		var v = (dot00 * dot12 - dot01 * dot02) * invDenom;
		// Check if point is in triangle
		return (u >= 0) && (v >= 0) && (u + v < 1);
    }

	function input() {
		sigCanvas = document.getElementById("canvasSignature");
	}

	$("#snake").mousedown(function (mouseEvent) {	
        if (state === "gameOver") {
        	d = "enter";
        	return;
        }

        var position = getPosition(mouseEvent, sigCanvas);
        d = checkQuadrant(position);
    });

	function update() {
		input();
		if (state === "playing") {
			play();
		} else if (state === "pause") {
			pauseState();
		} else if (state === "gameOver") {
			gameOver();
		}
		paint();
	}

	function pauseState() {
		if (d === "enter") {
			state = "playing";
			resetGame();
		}
	}

	function gameOver() {
		if (d === "enter") {
			state = "playing";
			resetGame();
		}
	}

	function play() {
		context.fillStyle = background;
		context.fillRect(0, 0, width, height);
		context.strokeStyle = border;
		context.strokeRect(0, 0, width, height);

		var nx = snake[0].x;
		var ny = snake[0].y;

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
			if (nx == -1 || nx == numCellsWidth || ny == -1 || ny == numCellsHeight || checkCollision(nx, ny, snake)) {
				state = "gameOver";
				checkRecord(score);
				return;
			}

			//if(nx == food.x && ny == food.y) {
			var hasEaten = hasEatenFood(nx,ny);
			if (hasEaten !== 0) {
				if (hasEaten === -1) {
					//incorrect food
					state = "gameOver";
					checkRecord(score);
					return;
				} else {
					//correct food
					//level += 10; 
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
	}

	function paint() {
		context.fillStyle = background;
		context.fillRect(0, 0, width, height);
		context.strokeStyle = border;
		context.strokeRect(0, 0, width, height);

		if (state === "gameOver") {
			paintGameOver();
		}

		for (var i = 0; i < snake.length; i++) {
			var c = snake[i];
			paintCell(c.x, c.y, snakeColor);
		}

		var scoreText = "Score: " + score;
		context.fillText(scoreText, 5, height - 5);

		for (var i = 0; i < numFood; ++i) {
			paintCell(listFood[i].x, listFood[i].y, listFood[i].color);
		}
	}

	function generateTextGameOver() {

		var offsetX = 9;
		var offsetY = 9;
		var clr = 'black';

		// G
		textGameOver.push({x: offsetX + 2, y: offsetY + 1, color:clr});
		textGameOver.push({x: offsetX + 3, y: offsetY + 1, color:clr});
		textGameOver.push({x: offsetX + 4, y: offsetY + 1, color:clr});
		textGameOver.push({x: offsetX + 5, y: offsetY + 2, color:clr});
		textGameOver.push({x: offsetX + 1, y: offsetY + 2, color:clr});
		textGameOver.push({x: offsetX + 1, y: offsetY + 3, color:clr});
		textGameOver.push({x: offsetX + 1, y: offsetY + 4, color:clr});
		textGameOver.push({x: offsetX + 1, y: offsetY + 5, color:clr});
		textGameOver.push({x: offsetX + 1, y: offsetY + 6, color:clr});
		textGameOver.push({x: offsetX + 2, y: offsetY + 7, color:clr});
		textGameOver.push({x: offsetX + 3, y: offsetY + 7, color:clr});
		textGameOver.push({x: offsetX + 4, y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 4, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 3, y: offsetY + 4, color:clr});

        // A
        textGameOver.push({x: offsetX + 8, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 9, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 10,y: offsetY + 1, color:clr});        
        textGameOver.push({x: offsetX + 11,y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 11,y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 11,y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 11,y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 11,y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 11,y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 8, y: offsetY + 4, color:clr});        
        textGameOver.push({x: offsetX + 9, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 10,y: offsetY + 4, color:clr});

        // M
        textGameOver.push({x: offsetX + 13, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 14, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 15, y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 16, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 7, color:clr});

        // E
        textGameOver.push({x: offsetX + 19, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 7, color:clr});

        //O 
        textGameOver.push({x: offsetX + 2, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 1, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 1, y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 1, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 1, y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 1, y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 2, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 3, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 4, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 4, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 3, y: offsetY + 17, color:clr});

        // V
        textGameOver.push({x: offsetX + 7,  y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 7,  y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 7,  y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 7,  y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 8,  y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 8,  y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 9,  y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 10, y: offsetY +  16, color:clr});
        textGameOver.push({x: offsetX + 10, y: offsetY +  15, color:clr});
        textGameOver.push({x: offsetX + 11, y: offsetY +  14, color:clr});
        textGameOver.push({x: offsetX + 11, y: offsetY +  13, color:clr});
        textGameOver.push({x: offsetX + 11, y: offsetY +  12, color:clr});
        textGameOver.push({x: offsetX + 11, y: offsetY +  11, color:clr});

        // E
        textGameOver.push({x: offsetX + 13, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 14, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 14, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 14, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 15, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 15, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 15, y: offsetY + 11, color:clr});

        // R
        textGameOver.push({x: offsetX + 17, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 18, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 18, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 17, color:clr});

	}

	function generateTextPause() {

	}

	function paintGameOver() {
		var lng = textGameOver.length;
		for (var i = 0; i < lng; ++i) {
			paintCell(textGameOver[i].x, textGameOver[i].y, textGameOver[i].color);
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

	function checkRecord(punt) {
		if (punt > record) {
			var text = 'Record: ' + punt;
			$( "#record" ).text( text );
		}
	}
});