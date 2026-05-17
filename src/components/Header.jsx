import SetSelector from './SetSelector.jsx';

export default function Header({
  sets, setsLoading, selectedSet, onSelectSet,
  viewMode, onViewMode,
  onToggleSidebar,
  isMobile,
}) {
  return (
    <nav className="nav">
      <div className="nav-logo">
        ⚓ OPTCG <span>ROI CALC</span>
      </div>

      <div className="nav-center">
        <SetSelector
          sets={sets}
          loading={setsLoading}
          value={selectedSet}
          onChange={onSelectSet}
        />
      </div>

      <div className="nav-right">
        {isMobile && (
          <button className="btn btn-ghost btn-icon" onClick={onToggleSidebar} title="Settings">
            ⚙
          </button>
        )}
        <div className="view-toggle">
          <button
            className={`view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
            onClick={() => onViewMode('grid')}
            title="Grid view"
          >
            ⊞
          </button>
          <button
            className={`view-toggle-btn${viewMode === 'table' ? ' active' : ''}`}
            onClick={() => onViewMode('table')}
            title="Table view"
          >
            ≡
          </button>
        </div>
      </div>
    </nav>
  );
}
