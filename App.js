import React, {Component} from 'react';
import {StyleSheet, Dimensions} from 'react-native';
import Canvas, {Image as CanvasImage} from 'react-native-canvas';
import {
    Toast,
    Fab,
    Root,
    Icon,
    View
} from 'native-base'

import {Font, AppLoading} from 'expo';

export default class App extends Component {

    // Constructors

    constructor(props) {
        super(props);
        this.canvas = null;
        this.ctx = null;
        this.ws = null;

        this.state = {
            loading: true,
            connected: false,
            config: null,
        };

        this.assets = {
            snake: null
        };

        this.snake = {};
        this.map = [];
        this.ranges = [];

        this.sq = Math.min(Dimensions.get('window').width, Dimensions.get('window').height)
    }

    async componentWillMount() {
        await Font.loadAsync({
            'Roboto': require('native-base/Fonts/Roboto.ttf'),
            'Roboto_medium': require('native-base/Fonts/Roboto_medium.ttf'),
        });

        this.setState({loading: false});
    }

    // Websocket communication

    join_game = () => {

        if (!this.state.connected) {
            this.ws = new WebSocket('ws://testing.route.technology:40004');

            this.ws.onmessage = (e) => {
                this.sort_comms(JSON.parse(e.data));
            };

            this.ws.onclose = this.ws.onerror = (e) => {

                this.setState({connected: false});
                Toast.show({
                    text: "\n\n\t\tConnection closed.",
                    position: "top",
                    type: "danger"
                })
            }
        }
    };

    sort_comms = (data) => {
        if (data.code < 0) {
            // Handle errors (codes below 0)
            // YOUR CODE HERE

            return;
        }

        if (data.code === '514') {

            // Handle new game

            this.setState({
                connected: true,
                config: data.config,
            });

            this.draw_board();

            Toast.show({
                text: "\n\n\t\tWelcome to " + data.game + ", enjoy!",
                position: "top",
                type: "success"
            });

            return;
        }

        if (data.code === '541') {

            // Handle Map Update

            this.snake = data.snake;
            this.map = data.map;
            this.ranges = data.ranges;

            this.process_map();
            return;
        }

        if (data.code === '552') {

            // Handle death
            // YOUR CODE HERE
        }
    };

    rotate = (right) => {
        if (this.state.connected && this.ws.readyState === this.ws.OPEN) {
            this.ws.send(
                JSON.stringify({
                    intent: 'rotate',
                    payload: {
                        rotate: right ? 'right' : 'left'
                    }
                })
            )
        }
    };

    // Rendering

    handleCanvas = (canvas) => {
        this.canvas = canvas;
        this.canvas.width = this.canvas.height = this.sq;
        this.ctx = this.canvas.getContext('2d');

        this.load_sprite();

        console.log(this.sq);
        console.log(this.canvas.width + 'x' + this.canvas.height);
    };

    process_map = () => {
        this.clear_canvas();
        this.draw_board();
        this.map.forEach(this.draw_snake);
        this.draw_self_snake(this.snake)
    };

    clear_canvas = () => {
        this.ctx.clearRect(0, 0, this.sq, this.sq);
    };

    draw_board = () => {
        let side = this.sq / this.state.config.v_window;

        this.ctx.beginPath();
        this.ctx.lineWidth = "1";
        this.ctx.strokeStyle = "#ccc";

        for (let i = 0; i < this.state.config.v_window + 1; i++) {
            // Draw board
            // YOUR CODE HERE
        }

        this.ctx.stroke();
        this.ctx.save();
    };

    // Others' snakes

    draw_snake = (snake) => {
        let offset = [this.ranges[0][0], this.ranges[1][0]],
            side = this.sq / this.state.config.v_window;

        this.ctx.fillStyle = '#aaa';
        let first = snake.coords.shift();
        this.draw_square(first, offset, side);

        this.ctx.fillStyle = '#777';
        snake.coords.forEach((coords) => {
            this.draw_square(coords, offset, side);
        });

        this.ctx.save();
    };

    draw_square = (coords, offset, side) => {
        let x = coords[0] - offset[0], y = coords[1] - offset[1];
        if (Math.min(x, y) >= 0 && Math.max(x, y) <= this.state.config.v_window) {
            this.ctx.fillRect(x * side, y * side, side, side);
        }
    };

    // Self snake (image)

    draw_self_snake = (snake) => {

        let head = {N: [3, 0], E: [4, 0], S: [4, 1], W: [3, 1]};

        let offset = [this.ranges[0][0], this.ranges[1][0]],
            side = this.sq / this.state.config.v_window;

        let first = snake.coords.shift(),
            draw = head[snake.direction];

        this.draw_image(first, draw, offset, side, 3);

        this.ctx.fillStyle = 'green';
        snake.coords.forEach((coords) => {
            this.draw_square(coords, offset, side);
        });

        this.ctx.save();
    };

    draw_image = (coords, draw, offset, side, of=0) => {
        let x = coords[0] - offset[0], y = coords[1] - offset[1];
        if (Math.min(x, y) >= 0 && Math.max(x, y) <= this.state.config.v_window) {
            this.ctx.drawImage(this.assets.snake, draw[0] * 64, draw[1] * 64, 64, 64, x * side - of, y * side - of, side + of * 2, side + of * 2);
        }
    };

    render() {

        if (this.state.loading) {
            return <AppLoading/>;
        }

        return (
            <Root style={{flex: 1, paddingTop: 24}}>
                <View style={{flex: 1, paddingTop: 100}}>
                    <View pointerEvents='none'>
                        <Canvas ref={this.handleCanvas}/>
                    </View>
                    <View style={{flex: 1}}>
                        <Fab
                            style={{backgroundColor: this.state.connected ? 'blue' : 'grey'}}
                            position={"bottomRight"}
                            active={false}
                            onPress={() => {
                                this.rotate(true)
                            }}
                        >
                            <Icon name={"ios-arrow-forward"}/>
                        </Fab>
                        <Fab
                            style={{backgroundColor: this.state.connected ? 'blue' : 'grey'}}
                            position={"bottomLeft"}
                            active={false}
                            onPress={() => {
                                this.rotate(false)
                            }}
                        >
                            <Icon name={"ios-arrow-back"}/>
                        </Fab>
                        <Fab
                            style={{backgroundColor: this.state.connected ? 'grey' : 'lightblue'}}
                            position={"topRight"}
                            active={false}
                            onPress={() => {
                                this.join_game()
                            }}
                        >
                            <Icon name={"md-play"}/>
                        </Fab>
                    </View>
                </View>
            </Root>
        );
    }

    load_sprite = () => {
        this.assets.snake = new CanvasImage(this.canvas);

        // This is the snake's image
        this.assets.snake.src = 'data:image/png;base64,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';
        this.assets.snake.addEventListener('load', () => {console.log('image is loaded');});
    }
}
