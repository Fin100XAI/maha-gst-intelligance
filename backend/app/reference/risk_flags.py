"""The 34 risk flags, in the department's own words.

Source: *Risk Flags and Action Points for Decision support*, the circular
supplied by the department. The ``source_text`` of every entry below is that
document's own cell, stored verbatim and never edited — if the platform's
reading of a flag is wrong, the way to find out is to read the original beside
it, not to read a paraphrase of it.

``plain`` is this platform's restatement in ordinary language. It is an aid to
the reader and carries no authority: where the two differ, the circular wins,
and the alignment screen shows both so that the difference is visible.

The circular closes by stating that each flag is followed by a numeral 1 to 4,
rising with risk — which is the Flag 0–4 ladder the engine implements, with 0
added for "tested and clear", a state the circular does not need to name but a
platform does.

Nothing in this module computes anything. It is text.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final

__all__ = ["SOURCE_FLAGS", "SOURCE_LADDER_NOTE", "SOURCE_TITLE", "SourceFlag"]

SOURCE_TITLE: Final = "Risk Flags and Action Points for Decision support"

SOURCE_LADDER_NOTE: Final = (
    "The above Risk Flags will be followed by numerals Flags 1, 2, 3 and 4, which denotes "
    "the increase in risk level as the number increases. Thus the risk level in a category "
    "will be higher with increase in Flag numerals. Accordingly the level of scrutiny in "
    "audit should be increased to more intense where the risk score is higher."
)


@dataclass(frozen=True, slots=True)
class SourceFlag:
    """One row of the department's table."""

    #: The circular's own label, e.g. "P 01".
    label: str
    #: The platform's parameter id, e.g. "P01".
    param_id: str
    #: The circular's cell, verbatim.
    source_text: str
    #: The same thing in ordinary language. No authority; an aid to reading.
    plain: str


def _f(label: str, param_id: str, source_text: str, plain: str) -> SourceFlag:
    return SourceFlag(label=label, param_id=param_id, source_text=source_text, plain=plain)


SOURCE_FLAGS: Final[tuple[SourceFlag, ...]] = (
    _f(
        "P 01",
        "P01",
        "(i) Sale turnover (3.1 of GSTR-3B) is less than the purchase turnover (GSTR3B Table 5 "
        "+ Table 3.1(d) + GSTR2A Taxable Value+ Import of Goods) (ii) Compare the ratio of Sale "
        "turnover to purchase turnover in 18-19 vis-à-vis 17-18 Check the reason for higher "
        "purchase turnover and lower sales turnover. Select some high value Purchase and Sales "
        "invoices and verify the correct accounting of the same.",
        "The business bought more than it sold. That can be genuine — stock building, a bad "
        "year — but it is also what under-declared sales look like.",
    ),
    _f(
        "P 02",
        "P02",
        "IGST payment at the time of import is more than the ITC availed {Col.2 of table 4(A) "
        "(1) & (2) of GSTR-3B} in corresponding period. The reason for the difference to be "
        "ascertained and analysed including checking of transport documents. The Goods or "
        "Services if supplied in the course of furtherance of business, whether invoice is "
        "issued and tax is paid.",
        "More IGST was paid at the port than was later claimed back as credit. The goods came "
        "in; the question is where they went.",
    ),
    _f(
        "P 03",
        "P03",
        "(i) Check the ratio of nil/exempt to total turnover (minus non GST supplies) (ii) Carry "
        "out comparative analysis of ratio of nil/exempt to total turnover (minus non GST "
        "supplies) in 18-19 vis-à-vis 17-18 {(col. 2 of Table 3.1 (c) /(col. 2 of Table 3.1 "
        "(a)+(b)+(c) of GSTR-3B)}. Check the correctness of Nil/Exempt supplies. Whether the "
        "conditions of NIL/exempt supplies correctly fulfilled including ITC "
        "non-availment/reversal. Verify sample contracts/supply orders.",
        "How much of what they sell is claimed to be exempt from tax — and whether that share "
        "has grown. Exempt sales carry no tax, so the claim has to hold up.",
    ),
    _f(
        "P 04",
        "P04",
        "Check the ratio of Zero-rated to total turnover (minus non GST supplies) {( col. 2 of "
        "Table 3.1 (b) and col. 2 of (Table 3.1 (a)+(b)+(c) of GSTR-3B)} Check the correctness "
        "of Zero rated supplies. Whether all the conditions of such supplies fulfilled "
        "including due exportation of goods/services.",
        "How much is claimed as exports or supplies to an SEZ, which carry no tax and often a "
        "refund. The goods must actually have left.",
    ),
    _f(
        "P 05",
        "P05",
        "(i) Check the ratio of inward supplies (liable to reverse charge) to total turnover "
        "(ii) Carry out comparative analysis of the ratio of inward supplies (liable to reverse "
        "charge) to total turnover [{col. 2 of 3.1(d)} / {col. 2 of 3.1(a+b+c}] Verify the "
        "correctness of total inward supplies liable to reverse charge. Select sample invoices "
        "of high value for test checking. Verify contracts/supply orders.",
        "Purchases on which the buyer, not the seller, owes the tax — measured against the "
        "size of the business.",
    ),
    _f(
        "P 06",
        "P06",
        "Positive Difference between tax liability under RCM in Table 4 of GSTR 2A and "
        "[Difference between Tax liability in col (3) to (6) of able 3.1(d) of GSTR 3B and ITC "
        "taken on import of Services in col (2) to (5) of Table 4(A)(2)] Verify some high value "
        "import invoices and correctness of ITC taken and compare with tax liability under RCM",
        "The suppliers' own filings say more reverse-charge tax was due than the business "
        "declared it owed.",
    ),
    _f(
        "P 07",
        "P07",
        "There is a very High Ratio of Tax paid through ITC in col.(3) to (6) to total Tax "
        "payable in col.(2) of T6.1 of GSTR-3B. Verify the correctness of ITC availed. Verify "
        "sample invoices of high value and recurring supplies, supplies from sister concern and "
        "purchased from Dealers. Verify sample invoices to check that no ITC on exempted goods "
        "is taken. Tax rate on inputs/outputs to be checked to ascertain the reason. Exercise "
        "check to rule out availment of credit on fake invoices by way of verification from the "
        "details of e-way bill, payment particulars, input output ratio, etc. In case the "
        "entire tax liability is paid out of ITC, extra efforts needed to check wrong availment "
        "of ITC.",
        "Almost all the tax was settled with credit rather than cash. The circular is explicit: "
        "if the whole liability went out through credit, look harder — this is the shape "
        "fake-invoice credit takes.",
    ),
    _f(
        "P 08",
        "P08",
        "Ratio of tax payment through cash in col. (8) to total liability in col. (2) of T 6.1 "
        "of GSTR-3B. Verify the ratio of cash payment of tax and tax liability, find out the "
        "reason for adverse ratio.",
        "The other side of the same coin: how much of the tax actually arrived as money.",
    ),
    _f(
        "P 09",
        "P09",
        "Decline in average monthly taxable turnover in T3.1 (A+B+C) of GSTR 3 B. Find out the "
        "reason for decline.",
        "Sales are falling month on month. It may be the market; it may be sales moving off "
        "the books.",
    ),
    _f(
        "P 10",
        "P10",
        "(i) Check the ratio of Non GST supplies to total turnover (ii) Carry out comparative "
        "analysis of the ratio of Non GST supplies to total turnover in 18-19 vis-à-vis 17-18 "
        "{( col. 2 of Table 3.1 (e) /( col. 2 of Table 3.1 (a)+(b)+(c)+(e) of GSTR-3B)} Verify "
        "Sample invoices of Non-GST supplies and ensure that the same is not liable to GST. "
        "Verify that no ITC pertaining to Non GST supply is taken.",
        "How much is declared as outside GST altogether — and whether credit was taken on it "
        "anyway, which it should not have been.",
    ),
    _f(
        "P 11",
        "P11",
        "The taxpayer has filed more than six GST returns late. Therefore, the penalty for late "
        "filing of returns and payment of interest for delay in tax payment should be verified.",
        "More than six returns filed after the due date. Late fee and interest follow "
        "arithmetically.",
    ),
    _f(
        "P 12",
        "P12",
        "The taxpayer has not filed less than 3 GST returns in a financial year. Ensure that "
        "correct liability for the period for which the returns are not filed is arrived at and "
        "recovered with interest and penalty. Cross verify the details from e way bills issued "
        "by the taxpayer as well as details shown in GSTR 2(A) returns",
        "Returns missing for the year. The liability for those months still exists — e-way "
        "bills and the suppliers' filings show roughly what it was.",
    ),
    _f(
        "P 13",
        "P13",
        "The taxpayer has SEZ and non-SEZ registration with same PAN in same State. Input "
        "Output ratio of both SEZ and Non SEZ to be verified separately to check diversion of "
        "duty free inputs to DTA units. Also to check that goods manufactured in SEZ units are "
        "not shown cleared from DTA unit to reduce duty liability to the extent of BCD. To "
        "check wrong availment of ITC in DTA unit on the procurements made for SEZ unit",
        "The same PAN holds both an SEZ and an ordinary registration in this State — the "
        "structure through which duty-free inputs can be moved to the taxed side.",
    ),
    _f(
        "P 14",
        "P14",
        "There is a positive difference between ITC shown in Table 4A (5) of GSTR 3B and ITC as "
        "per GSTR – 2A. Reason of mismatch of credit to be ascertained to check wrong availment "
        "of ITC as well as ITC taken on fake invoices. Verification of e way bill details may "
        "also be helpful in the exercise. Check sample high value invoices to verify proper "
        "availment.",
        "More credit was claimed than the suppliers' own returns support. The gap is either a "
        "supplier who did not file, or an invoice that does not exist.",
    ),
    _f(
        "P 15",
        "P15",
        "There is a positive difference between ITC taken on import of goods {col. 2 of table 4 "
        "(A) (1) of GSTR-3B} vis-à-vis IGST paid to Customs at the time of import of goods. "
        "Verify the point in details to ascertain the reasons and to ensure that wrong ITC "
        "credit taken is reversed and also to rule out the possibility of taking ITC credit on "
        "bill of entry in the name of other person or credit of BCD taken as well.",
        "Credit claimed on imports exceeds the IGST customs actually received — including the "
        "possibility of claiming on another person's bill of entry.",
    ),
    _f(
        "P 16",
        "P16",
        "The ratio of tax paid under reverse charge (as per {Col. 3+4+5+6 of Table 3.1(d)} to "
        "ITC taken on import of services/other reverse charge (other than import of goods) "
        "{Col. 2+3+4+5 of Table 4A (2+3) of GSTR-3B} is low (less than 1). Check the reason for "
        "low tax payment under reverse charge shown in table 3.1 (d) of GSTR 3B in comparison "
        "with ITC taken on import of services/ other reverse charge (other than import of "
        "goods) as shown in Table 4 A (2+3) of GSTR 3B. Verify sample high value invoices.",
        "Credit was taken for reverse-charge tax that was never paid. You cannot claim back "
        "what you did not hand over.",
    ),
    _f(
        "P 17",
        "P17",
        "(i) High Ratio of ISD credit ({Col. 2+3+4+5 of Table 4A(4) of GSTR-3B) with total ITC "
        "taken (ii) Comparative analysis of the ratio of ISD Credit with Total ITC taken in "
        "18-19 vis-à-vis 17-18 Check the trend from previous 2/3 years to ensure that no "
        "ineligible ITC is taken and routed through ISD To check that ITC pertaining to other "
        "unit where no utilization is possible, diverted to the unit through ISD mechanism Also "
        "to check the admissibility of ITC to ISD and the reason of transferring high value of "
        "ITC through ISD be ascertained and analysed.",
        "A large share of the credit arrived from the group's own distribution arm rather than "
        "from purchases this unit made — a route for credit that could not be used elsewhere.",
    ),
    _f(
        "P 18",
        "P18",
        "(i) Ratio of ITC reversed to ITC taken [{Col. 2+3+4+5 of Table 4(B)/{col 2+3+4+5 of "
        "table 4A}] (ii) Comparative analysis of the ratio of ITC reversed to ITC taken in "
        "18-19 vis-à-vis 17-18 Check in detail the ITC reversed whether the condition for such "
        "reversal is supported by proper documents. Check sample high value invoices. Reason "
        "for high reversal to be ascertained and analysed from legal perspective. Check that "
        "reversal in respect of exempted supply has been correctly made",
        "How much claimed credit was later given back. A lot of reversal suggests the original "
        "claims were not right in the first place.",
    ),
    _f(
        "P 19",
        "P19",
        "Comparison between [Ratio of nil/exempt (table 3.1 (c) of GSTR-3B) to total turnover "
        "{table 3.1 (a)+(b)+(c)} ] and [Ratio of ITC reversed (table 4(b)(1) to ITC taken "
        "(4(A)]. To verify that the proper ITC reversal/non availment in respect of "
        "Nil/exempted supplies has been done.",
        "Exempt sales require a matching share of credit to be given back. This checks the two "
        "against each other.",
    ),
    _f(
        "P 20",
        "P20",
        "Taxable value of exports of goods as per Table 6(A) of GSTR-1 vis-à-vis IGST value in "
        "shipping bill data (Customs data). Select sample high value Shipping Bills and verify "
        "in details the accounting and value of export goods.",
        "What was declared as exported, against what customs recorded leaving the country.",
    ),
    _f(
        "P 21",
        "P21",
        "(i) Check the ratio of zero rated supply to SEZ as per Table 6(B) of GSTR-1 to total "
        "GST turnover during the year. (ii) Conduct comparative analysis of the ratio of zero "
        "rated supply to SEZ as per Table 6(B) of GSTR-1 to total GST turnover in 18-19 "
        "vis-à-vis 17-18. In case such ratio is adverse verify some sample related accounting "
        "details and supply documents. Check, Supplies made to SEZ for its correctness. Since "
        "the clearance to SEZ is higher than the average trend, therefore it needs to be "
        "verified that the zero rated supply to SEZ is correct and there is no diversion of "
        "goods so cleared.",
        "The share of sales going to SEZ units tax-free, and whether it has jumped.",
    ),
    _f(
        "P 22",
        "P22",
        "(i) Check the ratio of deemed exports as per Table 6(C) of GSTR-1 to total GST "
        "turnover during the year. (ii) Conduct comparative analysis of the ratio of deemed "
        "exports as per Table 6(C) of GSTR-1 to total GST turnover in 18-19 vis-à-vis 17-18 In "
        "case the ratio is adverse, verify all the related accounting details and check sample "
        "documents of deemed export. Check in detail the clearances of deemed exports.",
        "Sales treated as exports although the goods never left India, and whether that share "
        "has grown.",
    ),
    _f(
        "P 23",
        "P23",
        "(i) Ratio of turnover of Zero-rated supply other than export of goods {GSTR 3B (3.1 b "
        "– exports from customs data base)] to total supplies {table 3.1(a)+(b) of GSTR-3B}] "
        "during the year (ii) Comparative analysis of the ratio of turnover of Zero-rated "
        "supply other than export of goods (GSTR 3B (3.1 b – exports from customs data base)] "
        "to total supplies {table 3.1(a)+(b) of GSTR-3B}] in 18-19 vis-à-vis 17-18. Check the "
        "ratio and in case the ratio is adverse, verify all the related accounting details and "
        "check sample documents of zero rated supply.",
        "Zero-rated sales that customs cannot account for — what is left after the goods "
        "exports customs saw are taken out.",
    ),
    _f(
        "P 24",
        "P24",
        "Risk associated with other linked GSTINS of the PAN. There are multiple GSTINs with "
        "same PAN. Check supply and purchase details and other transactions with respect to "
        "these GSTINs.",
        "The same business holds other registrations. What happens between them is worth "
        "looking at.",
    ),
    _f(
        "P 25",
        "P25",
        "Check the amount of IGST Refund claimed (Risky Exporters). Select some sample "
        "documents related to high value transactions and verify the correctness of refund "
        "claimed.",
        "Money claimed back as an IGST export refund.",
    ),
    _f(
        "P 26",
        "P26",
        "Check the amount of LUT Export Refund claimed (Risky Exporters). Select some sample "
        "documents related to high value transactions and verify the correctness of refund "
        "claimed.",
        "Money claimed back on exports made under bond rather than on payment of tax.",
    ),
    _f(
        "P 27",
        "P27",
        "Check the amount of Refund claimed due to inverted duty structure (Risky Exporters). "
        "Select some sample documents related to high value transactions and verify the "
        "correctness of refund claimed.",
        "Money claimed back because inputs are taxed higher than the finished goods.",
    ),
    _f(
        "P 28",
        "P28",
        "Risky Taxpayers figuring in Red Flag Reports of DGARM. Check the Red Flag Report Nos. "
        "2, 3, 4 & 5 of DGARM and verify the details as mentioned in the red flags.",
        "Central analytics has already flagged this business.",
    ),
    _f(
        "P 29",
        "P29",
        "Check the ratio of taxable turnover as per T4 of ITC-04 vis a vis total taxable "
        "turnover in GSTR3B. Select some sample documents related to accounting of taxable "
        "turnover and verify the correctness of recording in ITC 04 and GSTR 3B",
        "Goods sent out for job work, against the size of the business. Material that leaves "
        "and does not come back is material that was sold.",
    ),
    _f(
        "P 30",
        "P30",
        "The same taxpayer was selected last year on risk criteria. Verify the risky criteria "
        "and check the same risk in the current audit period.",
        "This business was picked for audit last year too. Check whether the same problem is "
        "still there.",
    ),
    _f(
        "P 31",
        "P31",
        "Verify the ratio of Credit Notes to total taxable turnover value (GSTR-1 table 9 / "
        "total turnover (Table 3.1 (a)+(b)+(c) of GSTR-3B). Select some sample Credit Notes and "
        "verify the genuineness of the transactions mentioned in the same.",
        "How much of the declared sales was later cancelled by credit note. A credit note "
        "reduces tax, so a large share of them is worth reading.",
    ),
    _f(
        "P 32",
        "P32",
        "Verify the ratio of Debit Notes to total taxable turnover value (GSTR-1 table 9 / "
        "total turnover (Table 3.1 (a)+(b)+(c) of GSTR-3B). Select some sample Debit Notes and "
        "verify the genuineness of the transactions mentioned in the same.",
        "The same test for debit notes, which move the figure the other way.",
    ),
    _f(
        "P 33",
        "P33",
        "Compare the Turnover shown in GSTR-3B with the Turnover shown in ITR of the same "
        "period. In case of substantial difference, check the reason for such discrepancy of "
        "turnover shown in ITR & GSTR – 3B, by selecting sample transactions.",
        "The sales figure told to the income-tax department against the one told here. They "
        "should be the same business.",
    ),
    _f(
        "P 34",
        "P34",
        "Negligible income tax payment as per income tax return whereas the turnover as per "
        "GSTR-3B is substantial in the same period. Check the reason for such discrepancy by "
        "selecting sample transactions.",
        "Large sales declared here, almost no income tax paid there.",
    ),
)
