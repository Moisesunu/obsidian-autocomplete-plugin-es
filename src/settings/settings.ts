import { PluginSettingTab, App, Setting, Notice } from 'obsidian';
import type TAPlugin from 'src/main';
import { destroyTAUI } from './ui';

// TODO Add LaTex support

export interface TASettings {
    enabled: boolean; // Autocomplete enabling
    language: string; // Language support
    maxSuggestions: number; // Max number of proposed suggestions at a time
    addSpace: boolean; // Add space enabling
    customDict: string[];
    // latex: boolean; // LaTeX support
}

export const DEFAULT_SETTINGS: TASettings = {
    enabled: true,
    language: 'Español',
    maxSuggestions: 3,
    addSpace: false,
    customDict: [],
    // latex: false,
}

export class TASettingsTab extends PluginSettingTab {
    plugin: TAPlugin;

    constructor(app: App, plugin: TAPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const containerEl = this.containerEl;
        containerEl.empty();

        // Autocomplete setting
        new Setting(containerEl)
            .setName('Autocompletado')
            .setDesc('Habilita/deshabilita la función de autocompletado.')
            .addToggle(toggle =>
                toggle.setValue(this.plugin.settings.enabled)
                    .onChange(async val => {
                        this.plugin.settings.enabled = val;
                        if (!val) destroyTAUI;
                        await this.plugin.saveSettings();
                    }));

        // Language setting
        new Setting(containerEl)
            .setName('Lenguaje')
            .setDesc('Especifica el soporte de idioma del texto (solo se admite Español por el momento).')
            .addDropdown(dropdown =>
                dropdown.addOption('Español', 'Español')
                    .setValue(this.plugin.settings.language)
                    .onChange(async val => {
                        this.plugin.settings.language = val;
                        await this.plugin.saveSettings();
                    }));

        // Max suggestions setting
        new Setting(containerEl)
            .setName('Numero maximo de sugerencias')
            .setDesc('Numero maximo de sugerencias mostradas a la vez (3-10).')
            .addSlider(slider =>
                slider.setLimits(3, 10, 1)
                    .setValue(this.plugin.settings.maxSuggestions)
                    .setDynamicTooltip()
                    .onChange(async (val: number) => {
                        this.plugin.settings.maxSuggestions = val;
                        await this.plugin.saveSettings();
                    }));

        // Space terminator setting
        new Setting(containerEl)
            .setName('Agregar espacio despues de autocompletar')
            .setDesc('Habilita/deshabilita agregar un espacio después de las palabras autocompletadas.')
            .addToggle(toggle =>
                toggle.setValue(this.plugin.settings.addSpace)
                    .onChange(async val => {
                        this.plugin.settings.addSpace = val;
                        if (!val) destroyTAUI;
                        await this.plugin.saveSettings();
                    }));

        // Custom dictionary setting
        new Setting(containerEl)
            .setName('Diccionario personalizado')
            .setDesc('Agrega palabras a tu diccionario personalizado.')
            .addText(text => {
                text.setPlaceholder('e.g. tiktok');
                text.inputEl.addEventListener('keydown', async (e) => {
                    if (e.key === 'Enter') {
                        const word = text.getValue().trim();
                        if (word && !this.plugin.settings.customDict.includes(word)) {
                            this.plugin.settings.customDict.push(word);
                            this.plugin.wordTrie.insert(word);
                            await this.plugin.saveSettings();
                            // new Notice(`Added "${word}" to your custom dictionary.`);
                            this.display();
                        }
                    }
                });
            });

        // Manage custom dictionary subsetting
        if (this.plugin.settings.customDict.length > 0) {
            const scrollContainer = containerEl.createDiv({ cls: 'custom-word-scroll' }) as HTMLDivElement & {
                scrollTimeout?: number;
            };

            scrollContainer.addEventListener('scroll', () => {
                scrollContainer.classList.add('show');
                window.clearTimeout(scrollContainer.scrollTimeout);
                scrollContainer.scrollTimeout = window.setTimeout(() => {
                    scrollContainer.classList.remove('show');
                }, 1000);
            });

            this.plugin.settings.customDict.forEach((word: string, index: number) => {
                const row = new Setting(scrollContainer)
                    .setDesc(word)
                    .addButton(b =>
                        b.setButtonText('Eliminar')
                            .setTooltip(`Eliminar "${word}" de tu diccionario personalizado`)
                            .onClick(async () => {
                                this.plugin.settings.customDict.splice(index, 1);
                                this.plugin.wordTrie.remove(word);
                                await this.plugin.saveSettings();
                                // new Notice(`Removed "${word}" from your custom dictionary.`)
                                this.display();
                            }))
            })
        }

        // Clear custom dictionary setting
        new Setting(containerEl)
            .setName('Limpiar diccionario personalizado')
            .setDesc('Elimina todas las palabras de tu diccionario personalizado.')
            .addButton(b =>
                b.setButtonText('Reiniciar')
                    .setCta()
                    .onClick(async () => {
                        this.plugin.settings.customDict.forEach((word: string) => this.plugin.wordTrie.remove(word));
                        this.plugin.settings.customDict = [];
                        await this.plugin.saveSettings();
                        // new Notice('Custom dictionary cleared.')
                        this.display();
                    }));

        // LaTeX setting
        // new Setting(containerEl)
        //     .setName('LaTeX Support')
        //     .setDesc('Enable/disable LaTeX code autocomplete.')
        //     .addToggle(toggle =>
        //         toggle.setValue(this.plugin.settings.latex)
        //             .onChange(async val => {
        //                 this.plugin.settings.latex = val;
        //                 await this.plugin.saveSettings();
        //             }));
    }
}