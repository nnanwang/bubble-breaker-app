import aiExplorerImage from '../assets/ai-explorer.gif';
import startupBuilderImage from '../assets/startup-builder.gif';
import securitySpecialistImage from '../assets/security-specialist.gif';
import digitalCreatorImage from '../assets/digital-creator.gif';

const personaImages = {
  'ai-explorer': aiExplorerImage,
  'startup-builder': startupBuilderImage,
  'security-specialist': securitySpecialistImage,
  'digital-creator': digitalCreatorImage,
};

export function PersonaPortrait({ persona, className = '' }) {
  const classes = ['persona-portrait', persona.cropRight && 'crop-right', className].filter(Boolean).join(' ');
  return <div className={classes} data-persona={persona.id} aria-hidden="true">
    <img src={personaImages[persona.id]} alt="" loading="lazy" />
  </div>;
}

export default function PersonaCard({ persona, onSelect }) {
  return <article
    className="persona-card"
    role="button"
    tabIndex={0}
    aria-label={`Explore ${persona.name} feed`}
    onClick={() => onSelect(persona)}
    onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(persona);
      }
    }}
  >
    <PersonaPortrait persona={persona} />
    <h3>{persona.name}</h3>
    <p className="interest-tags">{persona.categories.join(' · ').toUpperCase()}</p>
  </article>;
}
