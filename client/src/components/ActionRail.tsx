// Right-side rail: Respin · Cherry · Give · React · Share.
// Hintology aesthetic: dark glass pill buttons floating over content.
// Respin button colour-codes free vs paid:
//   - free  → green ring (no money)
//   - paid  → amber ring + price chip
import type { UnitManifest } from '@/lib/taktak-data';

interface Props {
  unit: UnitManifest;
  onAction: (action: 'respin' | 'give' | 'cherry' | 'react' | 'share', unit: UnitManifest) => void;
}

export function ActionRail({ unit, onAction }: Props) {
  const price = unit.license.spinPrice ?? 0;
  const isPaid = price > 0;
  const respinHint = isPaid
    ? `Respin · LLM-правка с оплатой $${price.toFixed(2)} (revshare идёт оригинальному автору)`
    : 'Respin · бесплатно · LLM-правка без оплаты';

  return (
    <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-20">
      <RespinButton
        isPaid={isPaid}
        price={price}
        hint={respinHint}
        onClick={() => onAction('respin', unit)}
        testid={`action-respin-${unit.id}`}
      />
      <RailButton icon="🍒" label="Cherry"  hint="Заимствовать кусок этого поста в свой — AI вставит и оставит link-quote автору"
                  onClick={() => onAction('cherry', unit)} testid={`action-cherry-${unit.id}`} />
      <RailButton icon="♡"  label="Give"    hint="Patronage · revenue-share pass или анонимная благотворительность"
                  onClick={() => onAction('give',   unit)} testid={`action-give-${unit.id}`} />
      <RailButton icon="✦"  label="React"   hint="Сигнал · +0.1 к репутации автора"
                  onClick={() => onAction('react',  unit)} testid={`action-react-${unit.id}`} />
      <RailButton icon="↗"  label="Share"   hint="Поделиться · ссылка на этот пост"
                  onClick={() => onAction('share',  unit)} testid={`action-share-${unit.id}`} />
    </div>
  );
}

function RespinButton({
  isPaid, price, hint, onClick, testid,
}: { isPaid: boolean; price: number; hint: string; onClick: () => void; testid: string }) {
  const ringColor = isPaid ? '#F9A825' : '#4CAF50';
  return (
    <button
      onClick={onClick}
      title={hint}
      data-testid={testid}
      className="group flex flex-col items-center gap-0.5 w-12 relative"
    >
      <span
        className="w-11 h-11 rounded-full flex items-center justify-center text-lg text-white group-active:scale-95 transition-all shadow-lg"
        style={{
          background: 'rgba(30, 40, 50, 0.85)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: `0 0 0 2px ${ringColor}, 0 8px 22px -4px ${ringColor}66`,
        }}
      >
        ↺
      </span>
      <span
        className="text-[10px] font-mono uppercase tracking-wider"
        style={{ color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
      >
        Respin
      </span>
      {isPaid ? (
        <span
          className="absolute -top-1 -right-1 px-1 py-px rounded-full text-[8px] font-mono text-white font-bold"
          style={{ background: '#F9A825' }}
          title={`Цена respin: $${price.toFixed(2)}`}
        >
          ${price.toFixed(2)}
        </span>
      ) : (
        <span
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-mono text-white font-bold flex items-center justify-center"
          style={{ background: '#4CAF50' }}
          title="Respin бесплатно"
        >
          ✓
        </span>
      )}
    </button>
  );
}

function RailButton({
  icon, label, hint, onClick, testid,
}: { icon: string; label: string; hint: string; onClick: () => void; testid: string }) {
  return (
    <button
      onClick={onClick}
      title={hint}
      data-testid={testid}
      className="group flex flex-col items-center gap-0.5 w-12 relative"
    >
      <span
        className="w-11 h-11 rounded-full flex items-center justify-center text-lg text-white group-active:scale-95 transition-all shadow-lg group-hover:brightness-110"
        style={{
          background: 'rgba(30, 40, 50, 0.85)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 4px 14px -2px rgba(0,0,0,0.3)',
        }}
      >
        {icon}
      </span>
      <span
        className="text-[10px] font-mono uppercase tracking-wider text-white"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
      >
        {label}
      </span>
    </button>
  );
}
