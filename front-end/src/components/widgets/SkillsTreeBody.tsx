import type { Skill } from '../../types';
import './SkillsTreeBody.css';

export function SkillsTreeBody({ data }: { data: Record<string, unknown> }) {
  const skills = (data.skills ?? []) as Skill[];

  return (
    <div className="stree">
      {skills.map((s) => <SkillRow key={s.id} skill={s} depth={0} />)}
    </div>
  );
}

function SkillRow({ skill, depth }: { skill: Skill; depth: number }) {
  const color =
    skill.level >= 70 ? 'var(--secondary)' :
    skill.level >= 40 ? 'var(--primary-container)' :
    'var(--tertiary)';

  return (
    <>
      <div className="srow" style={{ paddingLeft: `${depth * 14}px` }}>
        <div className="srow__top">
          <span className="srow__name">{skill.name}</span>
          <span className="srow__pct">{skill.level}%</span>
        </div>
        <div className="srow__track">
          <div className="srow__fill" style={{ width: `${skill.level}%`, background: color }} />
        </div>
      </div>
      {skill.children?.map((c) => <SkillRow key={c.id} skill={c} depth={depth + 1} />)}
    </>
  );
}
