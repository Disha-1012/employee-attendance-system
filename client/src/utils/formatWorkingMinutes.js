export const formatWorkingMinutes = (
  minutes
) => {
  if (
    !minutes ||
    minutes < 0
  ) {
    return "0h 00m";
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remainingMinutes =
    minutes % 60;

  return `${hours}h ${remainingMinutes
    .toString()
    .padStart(2, "0")}m`;
};