import { Typography } from "@mui/material";

interface PartnerCardProps {
  title: string;
  description: string;
  link: string;
  logo: string;
}

const partners: PartnerCardProps[] = [];

export default function PartnersVests() {
  if (partners.length === 0) {
    return null;
  }
  return (
    <div className="mt-6 w-full self-start">
      <div className="flex flex-col gap-1 text-left">
        <Typography variant="h1">veNFT Partners</Typography>
        <Typography variant="body2">
          These are 3rd party projects. Do your own research and adopt whatever
          risk they entail.
        </Typography>
      </div>
      <div className="mt-5 flex flex-wrap justify-between gap-5">
        {partners.map((partner) => (
          <PartnerVestCard partner={partner} key={partner.title} />
        ))}
      </div>
    </div>
  );
}

const PartnerVestCard = ({ partner }: { partner: PartnerCardProps }) => {
  return (
    <a
      href={partner.link}
      rel="noreferrer noopener"
      target="_blank"
      className="relative flex min-h-[196px] w-96 flex-grow items-center justify-between gap-4 overflow-hidden rounded-2xl border border-gray-500 bg-deepPurple p-5 transition-colors after:pointer-events-none after:absolute after:-left-10 after:-bottom-32 after:h-full after:w-full after:bg-slate-300 after:opacity-0 after:blur-xl after:transition-all after:duration-500 hover:border-slate-400 hover:after:translate-x-10 hover:after:-translate-y-32 hover:after:opacity-10"
    >
      <img
        src={partner.logo}
        alt={`${partner.title} logo`}
        className="h-12 w-12"
      />
      <div className="flex h-full flex-grow flex-col justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-lg font-semibold">{partner.title}</div>
          <div className="font-light">{partner.description}</div>
        </div>
        <div className="w-fit text-sm font-bold text-cantoGreen underline transition-all hover:text-green-300 hover:no-underline">
          Check it out
        </div>
      </div>
    </a>
  );
};
