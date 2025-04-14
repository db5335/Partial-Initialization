import statistics
from sys import argv

filename = argv[1]

with open(filename) as file:
    n = int(file.readline())
    data = []
    for i in range(100):
        data.append(int(file.readline()) / n)

    print(min(*data))
    print(max(*data))
    print(statistics.mean(data))
    print(statistics.stdev(data))