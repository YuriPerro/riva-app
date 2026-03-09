import { useTranslation } from 'react-i18next';
import { FlipButton, FlipButtonBack, FlipButtonFront } from '../animate-ui/primitives/buttons/flip';
import { useSidebarGame } from './use-sidebar-game';

export function SidebarGame() {
  const { t } = useTranslation('common');
  const {
    canvasRef,
    gameState,
    score,
    currentLevel,
    gameSave,
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
        className="cursor-pointer rounded-md bg-surface outline-none"
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onClick={handleCanvasClick}
      />

      {gameState === 'playing' && (
        <div className="pointer-events-none absolute left-3 top-5 flex flex-col gap-0.5 text-[10px] text-fg-disabled/50">
          <span>{t('game.moveHint')}</span>
          <span>{t('game.fireHint')}</span>
        </div>
      )}

      {gameState === 'idle' && (
        <div className="absolute inset-x-2 inset-y-0 flex flex-col items-start px-3 justify-end gap-2 rounded-md bg-surface">
          <FlipButton onClick={handleNewGame} className="w-full">
            <FlipButtonFront className="border w-full py-2 cursor-pointer text-[11px] font-medium text-(--color-muted-foreground)">
              {t('game.letsPlay')}
            </FlipButtonFront>
            <FlipButtonBack className="cursor-pointer w-full py-2 text-accent">{t('game.fire')}</FlipButtonBack>
          </FlipButton>
        </div>
      )}

      {gameState === 'won' && (
        <div className="absolute inset-x-2 inset-y-0 flex flex-col items-center justify-center gap-1 rounded-md bg-base/90 backdrop-blur-sm">
          <span className="text-[11px] font-medium text-success">{t('game.levelClear')}</span>
          <span className="text-[9px] text-fg-muted">{t('game.nextLevel', { level: currentLevel + 1 })}</span>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-x-2 inset-y-0 flex flex-col items-center justify-center gap-2 rounded-md bg-base/90 backdrop-blur-sm">
          <span className="text-[10px] font-medium text-error">{t('game.gameOver')}</span>
          <span className="text-[11px] text-fg">{score}</span>
          <span className="text-[9px] text-fg-muted">{t('game.level', { level: currentLevel })}</span>
          {score >= gameSave.highScore && score > 0 && <span className="text-[9px] text-success">{t('game.newBest')}</span>}
          {score < gameSave.highScore && <span className="text-[9px] text-fg-muted">{t('game.best', { score: gameSave.highScore })}</span>}
          {gameSave.bestLevel > currentLevel && (
            <span className="text-[9px] text-fg-muted">{t('game.bestLevel', { level: gameSave.bestLevel })}</span>
          )}
          <button
            onClick={handleNewGame}
            className="cursor-pointer text-[11px] font-medium text-accent underline-offset-2 transition-colors hover:text-accent/80 hover:underline"
          >
            {t('game.restart')}
          </button>
        </div>
      )}
    </div>
  );
}
