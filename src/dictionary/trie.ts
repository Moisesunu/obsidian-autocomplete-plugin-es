class TrieNode {
    children: Record<string, TrieNode>;
    endOfWord: boolean;

    constructor() {
        this.children = {};
        this.endOfWord = false;
    }
}

export default class Trie {
    root: TrieNode;
    constructor() {
        this.root = new TrieNode();
    }

    // Insert a word into the trie
    insert(word: string): void {
        let tmp = this.root;
        for (const char of word) {
            if (!tmp.children[char]) {
                tmp.children[char] = new TrieNode();
            }
            tmp = tmp.children[char];
        }
        tmp.endOfWord = true;
    }

    
    // Safely remove a word from the trie
    private removeWord(node: TrieNode, word: string, index: number): boolean {
        // Base case: currently at the end of word
        if (index === word.length) {
            if (!node.endOfWord) return false; // Word does not exist
            node.endOfWord = false;
            return Object.keys(node.children).length === 0; // Node has children so cannot be safely deleted
        }

        const char = word[index];
        if (!node.children[char]) return false; // Word ir not in trie

        const canDeleteChild: boolean = this.removeWord(node.children[char], word, index + 1);
        if (canDeleteChild) {
            delete node.children[char];
            // Node has no children and is not the end of a word so it can safely be deleted
            return !node.endOfWord && Object.keys(node.children).length === 0;
        }
        return false; // Cannot safely detele child
    }

    // Remove a word from the trie
    remove(word: string): void {
        if (word.length === 0) return;
        this.removeWord(this.root, word, 0);
    }

    // Collect all words under a given node in the prefix tree
    collectWords(node: TrieNode, prefix: string, results: string[], limit: number): void {
        if (results.length >= limit) return; // Base Case: result list has reached search limit

        if (node.endOfWord && prefix !== '') { 
            results.push(prefix);
        }

        for (const char in node.children) {
            this.collectWords(node.children[char], prefix + char, results, limit);
        }
    }

    // Find all words with a given prefix in the trie
    findWordsWithPrefix(prefix: string, limit: number = Infinity) : string[]  {
        let tmp = this.root;
        for (const char of prefix) {
            if (!tmp.children[char]) {
                return [];
            }
            tmp = tmp.children[char];
        }

        const results: string[] = [];
        this.collectWords(tmp, prefix, results, limit);
        return results;
    }
}

export { Trie };