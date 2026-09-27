import os

_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "au_suburbs.txt")
_MIN_TOKEN_LEN = 4


class _TrieNode:
    __slots__ = ("children", "is_word")
    def __init__(self):
        self.children: dict[str, "_TrieNode"] = {}
        self.is_word = False


class SuburbTrie:
    """Prefix tree of known Australian suburb/city names """

    def __init__(self):
        self._root = _TrieNode()

    def insert(self, name: str) -> None:
        node = self._root
        for char in name.strip().lower():
            node = node.children.setdefault(char, _TrieNode())
        node.is_word = True

    def is_known_or_prefix(self, text: str) -> bool:
        """True if `text` is a full suburb name, or a (possibly truncated) prefix of one."""
        node = self._root
        for char in text.strip().lower():
            node = node.children.get(char)
            if node is None:
                return False
        return True

    @classmethod
    def from_file(cls, path: str) -> "SuburbTrie":
        trie = cls()
        with open(path, encoding="utf-8") as f:
            for line in f:
                name = line.strip()
                if name:
                    trie.insert(name)
        return trie


class MerchantCleaner:
    """Strips a trailing city/suburb from a raw bank-statement merchant string """

    def __init__(self, suburb_trie: SuburbTrie):
        self._trie = suburb_trie

    @classmethod
    def default(cls) -> "MerchantCleaner":
        return cls(SuburbTrie.from_file(_DATA_PATH))

    def clean(self, merchant: str) -> tuple[str, str | None]:
        """Return (business_name, location). location is None if nothing was stripped."""
        tokens = merchant.strip().split()

        if len(tokens) > 2:
            two_word = " ".join(tokens[-2:])
            if len(two_word) >= _MIN_TOKEN_LEN and self._trie.is_known_or_prefix(two_word):
                return " ".join(tokens[:-2]), two_word

        if len(tokens) > 1:
            last = tokens[-1]
            if len(last) >= _MIN_TOKEN_LEN and self._trie.is_known_or_prefix(last):
                return " ".join(tokens[:-1]), last

        return merchant.strip(), None
