export const formatLeaderboardText = (voters: { rank: number; username: string; count: number }[]) => {
    if (voters.length === 0) return 'Henüz kimse oy vermemiş.';

    const lines = voters.map(v => {
        let arrow = " "; // Default space

        if (v.rank === 1) {
            arrow = " [1;33m» [0m"; // Gold
        } else if (v.rank === 2) {
            arrow = " [1;37m» [0m"; // Silver
        } else if (v.rank === 3) {
            arrow = " [0;33m» [0m"; // Bronze
        }

        const rank = v.rank.toString().padEnd(2, ' ');
        const votes = v.count.toString().padStart(4, ' ');

        return `${arrow} ${rank} | ${votes} OY | ${v.username}`;
    });

    return "```ansi\n" + lines.join('\n') + "\n```";
};
