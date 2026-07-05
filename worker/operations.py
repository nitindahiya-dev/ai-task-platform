"""Task operation implementations for the AI Task Processing Platform."""


def uppercase(text: str) -> str:
    """Convert all characters to uppercase."""
    return text.upper()


def lowercase(text: str) -> str:
    """Convert all characters to lowercase."""
    return text.lower()


def reverse_string(text: str) -> str:
    """Reverse the input string."""
    return text[::-1]


def word_count(text: str) -> str:
    """Return the total number of words."""
    count = len(text.split())
    return f"Word count: {count}"


OPERATIONS = {
    'uppercase': uppercase,
    'lowercase': lowercase,
    'reverse': reverse_string,
    'wordcount': word_count,
}
