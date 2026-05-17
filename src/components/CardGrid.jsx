import CardItem from './CardItem.jsx';

export default function CardGrid({ cards, onCardClick, watchlist, onToggleWatch }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          rawPrice={card.rawPrice}
          psa9Price={card.psa9Price}
          psa10Price={card.psa10Price}
          psa9Roi={card.psa9Roi}
          psa10Roi={card.psa10Roi}
          psa9Profit={card.psa9Profit}
          psa10Profit={card.psa10Profit}
          priceSource={card.priceSource}
          isWatched={(watchlist || []).includes(card.id)}
          onToggleWatch={onToggleWatch}
          onClick={() => onCardClick(card)}
        />
      ))}
    </div>
  );
}
