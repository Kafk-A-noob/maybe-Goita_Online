import './style.css'
import { GoitaBoard } from './game/GoitaBoard.js'
import { Renderer } from './ui/Renderer.js'

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  const renderer = new Renderer(container);
  const game = new GoitaBoard(renderer);

  // Expose for debugging
  window.game = game;

  // Game start is now triggered by Renderer Start Screen
  // game.start();
});
