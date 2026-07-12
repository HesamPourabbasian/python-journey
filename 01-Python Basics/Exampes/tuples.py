# fruits = ("apple", "banana", "cherry")

# for fruit in fruits:
#     print(fruit)

# # With index
# for i, fruit in enumerate(fruits):
#     print(i, fruit)

numbers = (1, 2, 3, 4, 5)
first, *middle, last = numbers
print(first)    # 1
print(middle)   # [2, 3, 4]
print(last)     # 5