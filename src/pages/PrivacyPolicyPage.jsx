import { Link } from 'react-router-dom';
import { useI18n } from '../hooks/useI18n.js';
import { Brand } from '../components/common/Brand.jsx';

/**
 * Privacy policy.
 *
 * Kept as plain content inside the component rather than in the translation
 * dictionary: a legal notice is edited as a whole document, and splitting it
 * into hundreds of interface keys would make it harder to keep truthful.
 */

const CONTENT = {
  fr: {
    title: 'Politique de confidentialité',
    updated: 'Dernière mise à jour : 21 août 2026',
    back: 'Retour',
    sections: [
      {
        heading: '1. Responsable du traitement',
        body: [
          'mapNplan est un service de planification de voyage. Pour toute question relative à vos données personnelles, vous pouvez contacter le responsable du traitement à l’adresse indiquée en fin de document.',
        ],
      },
      {
        heading: '2. Données que nous collectons',
        body: [
          'Lors de la création d’un compte : votre adresse e-mail et votre mot de passe. Le mot de passe est chiffré par notre prestataire d’authentification ; il ne nous est jamais accessible en clair.',
          'Lors de l’utilisation du service : les informations de voyage que vous saisissez vous-même (destinations, dates, étapes, hébergements, budget, notes, listes).',
          'Nous ne collectons aucune donnée à des fins publicitaires et n’utilisons aucun outil de mesure d’audience ou de traçage tiers.',
        ],
      },
      {
        heading: '3. Données qui restent sur votre appareil',
        body: [
          'Les documents que vous importez (PDF de réservation, photos, billets) sont conservés uniquement dans le stockage local de votre navigateur. Ils ne sont pas transmis à nos serveurs.',
          'La reconnaissance automatique de texte (OCR) des documents importés s’exécute entièrement dans votre navigateur. Le contenu de vos documents n’est envoyé à aucun serveur, ni au nôtre, ni à un tiers.',
        ],
      },
      {
        heading: '4. Finalités et base légale',
        body: [
          'Vos données sont traitées uniquement pour vous fournir le service : conserver vos voyages, les synchroniser entre vos appareils et vous permettre d’y accéder depuis votre compte.',
          'La base légale est l’exécution du contrat qui nous lie lorsque vous créez un compte et utilisez le service (article 6.1.b du RGPD).',
        ],
      },
      {
        heading: '5. Hébergement et durée de conservation',
        body: [
          'Vos données de compte et de voyage sont hébergées par Supabase, sur des serveurs situés dans l’Union européenne (Francfort, Allemagne).',
          'Vos données sont conservées tant que votre compte existe. Elles sont supprimées définitivement lorsque vous supprimez votre compte.',
        ],
      },
      {
        heading: '6. Services tiers',
        body: [
          'Certaines fonctionnalités font appel à des services externes, qui reçoivent alors votre adresse IP du fait de la connexion technique. Aucun contenu de vos voyages ne leur est transmis, sauf lorsque cela est nécessaire à la fonctionnalité demandée (par exemple, le nom d’un lieu que vous recherchez).',
          'Cartographie : OpenFreeMap et OpenStreetMap. Recherche de lieux : Photon (Komoot) et Overpass. Calcul d’itinéraires : OSRM. Météo : Open-Meteo. Taux de change : Frankfurter. Bibliothèques de lecture de documents : jsDelivr.',
          'Lorsque vous ouvrez un lien vers un partenaire de réservation, vous quittez mapNplan et la politique de confidentialité de ce partenaire s’applique.',
        ],
      },
      {
        heading: '7. Vos droits',
        body: [
          'Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données.',
          'Portabilité : vous pouvez exporter l’intégralité de vos données à tout moment depuis Réglages, au format JSON.',
          'Effacement : vous pouvez supprimer définitivement votre compte et l’ensemble de vos données depuis Réglages. Cette action est irréversible.',
          'Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).',
        ],
      },
      {
        heading: '8. Cookies',
        body: [
          'mapNplan n’utilise pas de cookies publicitaires ni de cookies de mesure d’audience. Seul un stockage technique est utilisé pour maintenir votre session ouverte et conserver vos préférences d’affichage. Ce stockage est strictement nécessaire au fonctionnement du service.',
        ],
      },
      {
        heading: '9. Contact',
        body: [
          'Pour exercer vos droits ou pour toute question relative à cette politique, écrivez à : contact@mapnplan.com',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy policy',
    updated: 'Last updated: 21 August 2026',
    back: 'Back',
    sections: [
      {
        heading: '1. Data controller',
        body: [
          'mapNplan is a travel planning service. For any question about your personal data, you can contact the data controller at the address given at the end of this document.',
        ],
      },
      {
        heading: '2. Data we collect',
        body: [
          'When you create an account: your email address and password. The password is encrypted by our authentication provider and is never accessible to us in clear text.',
          'When you use the service: the travel information you enter yourself (destinations, dates, stops, accommodation, budget, notes, lists).',
          'We collect no data for advertising purposes and use no third-party analytics or tracking tools.',
        ],
      },
      {
        heading: '3. Data that stays on your device',
        body: [
          'Documents you import (booking PDFs, photos, tickets) are kept only in your browser’s local storage. They are not sent to our servers.',
          'Automatic text recognition (OCR) of imported documents runs entirely inside your browser. The content of your documents is sent to no server, neither ours nor a third party’s.',
        ],
      },
      {
        heading: '4. Purposes and legal basis',
        body: [
          'Your data is processed solely to provide the service: storing your trips, synchronising them across your devices and letting you access them from your account.',
          'The legal basis is the performance of the contract between us when you create an account and use the service (GDPR article 6.1.b).',
        ],
      },
      {
        heading: '5. Hosting and retention',
        body: [
          'Your account and trip data are hosted by Supabase, on servers located in the European Union (Frankfurt, Germany).',
          'Your data is retained for as long as your account exists. It is permanently deleted when you delete your account.',
        ],
      },
      {
        heading: '6. Third-party services',
        body: [
          'Some features call external services, which then receive your IP address as a result of the technical connection. No content from your trips is passed to them, except where it is required by the feature you asked for (for example, the name of a place you are searching).',
          'Mapping: OpenFreeMap and OpenStreetMap. Place search: Photon (Komoot) and Overpass. Route calculation: OSRM. Weather: Open-Meteo. Exchange rates: Frankfurter. Document reading libraries: jsDelivr.',
          'When you open a link to a booking partner, you leave mapNplan and that partner’s privacy policy applies.',
        ],
      },
      {
        heading: '7. Your rights',
        body: [
          'You have the right to access, rectify, erase, restrict, object to and port your data.',
          'Portability: you can export all of your data at any time from Settings, in JSON format.',
          'Erasure: you can permanently delete your account and all of your data from Settings. This action cannot be undone.',
          'You may also lodge a complaint with your national data protection authority.',
        ],
      },
      {
        heading: '8. Cookies',
        body: [
          'mapNplan uses no advertising or analytics cookies. Only technical storage is used, to keep your session open and remember your display preferences. This storage is strictly necessary for the service to work.',
        ],
      },
      {
        heading: '9. Contact',
        body: [
          'To exercise your rights or for any question about this policy, write to: contact@mapnplan.com',
        ],
      },
    ],
  },
};

export function PrivacyPolicyPage() {
  const { language } = useI18n();
  const content = CONTENT[language] || CONTENT.fr;

  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <Brand />
        <h1>{content.title}</h1>
        <p className="legal-page__updated">{content.updated}</p>

        {content.sections.map((section) => (
          <section key={section.heading} className="legal-section">
            <h2>{section.heading}</h2>
            {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}

        <Link className="legal-page__back" to="/dashboard">{content.back}</Link>
      </div>
    </div>
  );
}
