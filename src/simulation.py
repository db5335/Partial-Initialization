from math import log2
from random import randint
from sys import argv

n = 2 ** int(argv[1])
bins = [0 for _ in range(n)]
for i in range(n):
    bin = randint(0, n - 1)
    bins[bin] = bins[bin] + 1

groups = [0 for _ in range(n // 8)]
for i in range(n // 8):
    count = 0
    for j in range(8 * i, 8 * (i + 1)):
        count += bins[j] == 1
    if count >= 2:
        groups[i] = count

g_star = 2
while 2 * g_star <= n // log2(n):
    g_star *= 2

level = 1
g = n // 8
f = 2
while True:
    new_f = int((1 - 2 ** -level) * f * 2 ** f)
    new_g = g // new_f
    level += 1

    if g < g_star:
        break

    f = new_f
    g = new_g

    new_groups = [0 for _ in range(g)]
    groups_to_merge = len(groups) // g
    for i in range(g):
        count = 0
        for j in range(groups_to_merge * i, groups_to_merge * (i + 1)):
            count += groups[j]
        if count >= f:
            new_groups[i] = count
    groups = new_groups

new_groups = [0 for _ in range(g_star)]
groups_to_merge = len(groups) // g_star
if groups_to_merge > 1:
    for i in range(g_star):
        count = 0
        for j in range(groups_to_merge * i, groups_to_merge * (i + 1)):
            count += groups[j]
        if count >= f * groups_to_merge / 2:
            new_groups[i] = count
    groups = new_groups

for j in range(len(groups)):
    count += groups[j]

print(f'{count}/{n}')
print(count / n)
print(count > n / 60)
