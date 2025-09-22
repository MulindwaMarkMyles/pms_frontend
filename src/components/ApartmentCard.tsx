import React, { useState } from 'react';
import './ApartmentCard.css'; // Assume a CSS file for styles (create if needed)

interface ApartmentCardProps {
  apartment: {
    id: string;
    name: string;
    imageUrl: string;
    description: string;
  };
}

const ApartmentCard: React.FC<ApartmentCardProps> = ({ apartment }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="apartment-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-preview">
        <img src={apartment.imageUrl} alt={apartment.name} className="apartment-image" />
        {isHovered && (
          <div className="preview-overlay">
            <h3>{apartment.name}</h3>
            <p>{apartment.description}</p>
          </div>
        )}
      </div>
      <div className="card-background">
        {/* Creative background pattern using small squares for preview effect */}
        <div className="mini-squares"></div>
      </div>
    </div>
  );
};

export default ApartmentCard;
