library(tidyverse)
library(ggthemes)

output_folder <- "output"

# load data
data <- read_delim(file = file.path("data", "mortality_rates.csv"),
                   delim = ";",
                   quote = "",
                   locale = locale(decimal_mark = ","))

colnames(data) <- gsub(pattern = ",5", replacement = "", x = colnames(data))

# export cleaned data for workshop
data %>%
  filter(`Uncertainty bounds*` == "Median") %>%
  select(iso = `ISO Code`, matches("^1|2")) %>%
  write_csv(file = file.path(output_folder, "mortality_rates_clean.csv"))

# tidy
data %>%
  filter(`Uncertainty bounds*` == "Median") %>%
  select(iso = `ISO Code`, matches("^1|2")) %>%
  gather(key = "year", value = "mr", -iso) -> data.long

# plot all
data.long %>%
  ggplot(aes(x = year, y = mr, group = iso, color= iso)) +
  geom_line() +
  scale_color_viridis_d() +
  xlab("Year") + ylab("under five deaths / 1000 births") +
  theme_tufte() +
  theme(legend.position = "none", axis.text.x = element_text(angle = 90, hjust = 1)) -> p

pdf(file = file.path(output_folder, "all_mortality_rates.pdf"), width = 10)
print(p)
dev.off()

# venezuela
data.long %>%
  filter(iso == "VEN") %>%
  ggplot(aes(x = year, y = mr, group = iso, color= iso)) +
  geom_line() +
  xlab("Year") + ylab("under five deaths / 1000 births") +
  theme_tufte() +
  theme(legend.position = "none", axis.text.x = element_text(angle = 90, hjust = 1)) -> p

pdf(file = file.path(output_folder, "ven_mortality_rates.pdf"), width = 10)
print(p)
dev.off()

# dominica
data.long %>%
  filter(iso == "DMA") %>%
  ggplot(aes(x = year, y = mr, group = iso, color= iso)) +
  geom_line() +
  xlab("Year") + ylab("under five deaths / 1000 births") +
  theme_tufte() +
  theme(legend.position = "none", axis.text.x = element_text(angle = 90, hjust = 1)) -> p

pdf(file = file.path(output_folder, "dma_mortality_rates.pdf"), width = 10)
print(p)
dev.off()
