import { useSidebarGame } from './use-sidebar-game';

export function SidebarGame() {
  const {
    canvasRef,
    gameState,
    score,
    highScore,
    handleNewGame,
    handleKeyDown,
    handleKeyUp,
    handleCanvasClick,
    canvasWidth,
    canvasHeight,
  } = useSidebarGame();

  return (
    <div className="relative flex flex-col items-center px-2">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        tabIndex={0}
        className="cursor-pointer rounded-md bg-base outline-none"
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onClick={handleCanvasClick}
      />

      {gameState === 'idle' && (
        <div className="absolute inset-x-2 inset-y-0 flex flex-col items-center justify-center gap-2 rounded-md bg-base/90">
          <span className="text-[10px] text-fg-muted">SPACE INVADERS</span>
          <button
            onClick={handleNewGame}
            className="cursor-pointer rounded-sm bg-accent px-3 py-1 text-[11px] font-medium text-accent-fg transition-opacity hover:opacity-80"
          >
            Start
          </button>
          {highScore > 0 && <span className="text-[9px] text-fg-muted">Best: {highScore}</span>}
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-x-2 inset-y-0 flex flex-col items-center justify-center gap-2 rounded-md bg-base/90">
          <span className="text-[10px] font-medium text-error">GAME OVER</span>
          <span className="text-[11px] text-fg">{score}</span>
          {score >= highScore && score > 0 && <span className="text-[9px] text-success">New Best!</span>}
          {score < highScore && <span className="text-[9px] text-fg-muted">Best: {highScore}</span>}
          <button
            onClick={handleNewGame}
            className="cursor-pointer rounded-sm bg-accent px-3 py-1 text-[11px] font-medium text-accent-fg transition-opacity hover:opacity-80"
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
