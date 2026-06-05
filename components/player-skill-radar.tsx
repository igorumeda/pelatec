import { totalSkillPoints } from "@/lib/utils";

const skills = [
  { key: "shooting", label: "Chute", angle: -90 },
  { key: "dribbling", label: "Drible", angle: -30 },
  { key: "passing", label: "Passe", angle: 30 },
  { key: "defense", label: "Defesa", angle: 90 },
  { key: "strength", label: "Forca", angle: 150 },
  { key: "speed", label: "Velocidade", angle: 210 }
] as const;

type SkillShape = {
  shooting?: number | null;
  dribbling?: number | null;
  passing?: number | null;
  defense?: number | null;
  strength?: number | null;
  speed?: number | null;
};

function pointFor(angleDeg: number, radius: number, center = 110) {
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: center + Math.cos(angleRad) * radius,
    y: center + Math.sin(angleRad) * radius
  };
}

export function PlayerSkillRadar({ values }: { values: SkillShape }) {
  const maxRadius = 78;
  const totalPoints = totalSkillPoints(values);
  const polygon = skills
    .map((skill) => {
      const level = Number(values[skill.key] ?? 0);
      const point = pointFor(skill.angle, (level / 10) * maxRadius);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#13103a]/85 p-5 text-white shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-200/80">Pontuacao geral</p>
          <p className="mt-2 text-5xl font-extrabold leading-none text-white">{totalPoints}</p>
          <p className="mt-2 text-sm text-slate-300">Soma dos pontos distribuídos nas habilidades.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[220px,1fr]">
        <div className="mx-auto w-full max-w-[220px]">
          <svg viewBox="0 0 220 220" className="h-auto w-full">
            {[20, 40, 60, 78].map((radius) => {
              const points = skills.map((skill) => {
                const point = pointFor(skill.angle, radius);
                return `${point.x},${point.y}`;
              });
              return (
                <polygon
                  key={radius}
                  points={points.join(" ")}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                />
              );
            })}

            {skills.map((skill) => {
              const outer = pointFor(skill.angle, maxRadius);
              return (
                <g key={skill.key}>
                  <line x1="110" y1="110" x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <text
                    x={pointFor(skill.angle, 98).x}
                    y={pointFor(skill.angle, 98).y}
                    fill="rgba(226,232,240,0.95)"
                    fontSize="10"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {skill.label}
                  </text>
                </g>
              );
            })}

            <polygon points={polygon} fill="rgba(34,211,238,0.35)" stroke="rgba(110,231,255,0.95)" strokeWidth="3" />
            {skills.map((skill) => {
              const level = Number(values[skill.key] ?? 0);
              const point = pointFor(skill.angle, (level / 10) * maxRadius);
              return <circle key={skill.key} cx={point.x} cy={point.y} r="4.5" fill="#8bffdb" stroke="#081228" strokeWidth="2" />;
            })}
          </svg>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {skills.map((skill) => (
            <div key={skill.key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-100">{skill.label}</span>
                <span className="text-cyan-100">{Number(values[skill.key] ?? 0)}/10</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-lime-300"
                  style={{ width: `${Math.min(100, Number(values[skill.key] ?? 0) * 10)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
