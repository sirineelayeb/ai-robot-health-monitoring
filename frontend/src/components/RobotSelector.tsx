import { theme } from "../config/theme.ts";

type RobotSelectorProps = {
  robots: string[];
  selected: string;
  onSelect: (robot: string) => void;
};

export const RobotSelector = ({ robots, selected, onSelect }: RobotSelectorProps) => {
  return (
    <div className="flex gap-3 flex-wrap justify-center">
      {robots.map((robot) => {
        const isSelected = selected === robot;
        return (
          <button
            key={robot}
            onClick={() => onSelect(robot)}
            className={`px-6 py-3 ${theme.radius.lg} font-medium transition-all
              ${isSelected 
                ? `bg-cyan-600 text-white ${theme.shadow.lg} scale-105`
                : `bg-${theme.colors.background.card} text-${theme.colors.text.secondary} border border-${theme.colors.border.default} hover:border-blue-300 hover:${theme.shadow.md}`
              }`}
          >
            {robot.replace("_", " ").toUpperCase()}
          </button>
        );
      })}
    </div>
  );
};
